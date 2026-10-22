/* ============================================================
   Innovax Technology — Site behaviour
   Mobile nav, scroll reveal, config injection, form handling.
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = window.INNOVAX_CONFIG || {};

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Inject configured contact / social details ---------- */
  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) { el.textContent = value; }
      else { hideWithParent(el); }
    });
  }
  function setHref(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) { el.setAttribute("href", value); }
      else { hideWithParent(el); }
    });
  }
  function hideWithParent(el) {
    var li = el.closest("li");
    if (li) { li.hidden = true; } else { el.hidden = true; }
  }

  setText('[data-contact="email"]', CONFIG.email);
  setHref('a[data-contact="email"]', CONFIG.email ? "mailto:" + CONFIG.email : "");
  setText('[data-contact="phone"]', CONFIG.phone);
  setHref('a[data-contact="phone"]', CONFIG.phoneHref);
  setText('[data-contact="address"]', CONFIG.address);
  setHref('a[data-contact="whatsapp"]', CONFIG.whatsapp);
  setHref('a[data-contact="facebook"]', CONFIG.facebook);
  setHref('a[data-contact="linkedin"]', CONFIG.linkedin);

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Form validation + honest submission ---------- */
  var validators = {
    text: function (v) { return v.trim().length >= 2 || "Please enter at least 2 characters."; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Please enter a valid email address."; },
    phone: function (v) { return /^[+()\-\s\d]{7,20}$/.test(v.trim()) || "Please enter a valid phone number."; }
  };

  function fieldError(input) {
    var type = input.getAttribute("data-validate") || (input.type === "email" ? "email" : "text");
    var fn = validators[type] || validators.text;
    var result = fn(input.value);
    return result === true ? "" : result;
  }

  function showError(input, message) {
    var wrap = input.closest(".field");
    var errEl = wrap ? wrap.querySelector(".error") : null;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (errEl) { errEl.textContent = message; }
    } else {
      input.removeAttribute("aria-invalid");
      if (errEl) { errEl.textContent = ""; }
    }
  }

  function status(form, kind, message) {
    var box = form.querySelector(".form-status");
    if (!box) { return; }
    box.className = "form-status show " + kind;
    box.textContent = message;
    box.setAttribute("role", kind === "err" ? "alert" : "status");
  }

  function collect(form) {
    var data = {};
    form.querySelectorAll("input[name], select[name], textarea[name]").forEach(function (el) {
      if (el.type === "checkbox") { data[el.name] = el.checked; }
      else { data[el.name] = el.value; }
    });
    return data;
  }

  function mailtoFallback(form, data) {
    var lines = [];
    Object.keys(data).forEach(function (key) {
      if (key === "_hp") { return; }
      lines.push(key + ": " + data[key]);
    });
    var subject = (form.getAttribute("data-mail-subject") || "Website enquiry") + " — " + (data.fullName || data.name || "");
    var to = CONFIG.email || "info@innovax.pk";
    var href = "mailto:" + to +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));
    window.location.href = href;
    status(form, "info",
      "We opened your email client with this request pre-filled. If nothing opened, email us directly at " + to + ".");
  }

  document.querySelectorAll("form.js-lead-form").forEach(function (form) {
    var inputs = form.querySelectorAll("[data-validate], input[type=email]");

    inputs.forEach(function (input) {
      input.addEventListener("blur", function () { showError(input, fieldError(input)); });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") { showError(input, fieldError(input)); }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      inputs.forEach(function (input) {
        var msg = fieldError(input);
        showError(input, msg);
        if (msg && !firstInvalid) { firstInvalid = input; }
      });
      if (firstInvalid) {
        status(form, "err", "Please correct the highlighted fields and submit again.");
        firstInvalid.focus();
        return;
      }

      var data = collect(form);
      if (data._hp) { return; } // honeypot filled by a bot: ignore silently

      if (CONFIG.formEndpoint) {
        var btn = form.querySelector("[type=submit]");
        if (btn) { btn.disabled = true; }
        status(form, "info", "Sending your request…");
        fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) { throw new Error("Server responded " + res.status); }
          status(form, "ok", "Thank you — your request has been received. Our team will contact you shortly.");
          form.reset();
        }).catch(function () {
          status(form, "err", "We could not send your request right now. Please try again, or email us directly.");
        }).then(function () {
          if (btn) { btn.disabled = false; }
        });
      } else {
        mailtoFallback(form, data);
      }
    });
  });
})();

