(function () {
  "use strict";

  var SUPABASE_URL = "https://rfjcgbehvyybthprbvqm.supabase.co";
  var SUPABASE_KEY = "sb_publishable_E7O9tR2EkZP6-RQFrWUySA_m-V1RCnB";
  var client = window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var list = document.getElementById("blogPosts");
  var notice = document.getElementById("notice");

  function message(text) { if (notice) notice.textContent = text; }
  function formatDate(value) {
    return new Intl.DateTimeFormat("en-PK", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
  }
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Layout rules live here so the blog looks right even if blog.html is cached or out of date:
  // one post per row, and the picture always first inside each post.
  function injectBlogStyles() {
    if (document.getElementById("blogLayoutStyles")) return;
    var style = document.createElement("style");
    style.id = "blogLayoutStyles";
    style.textContent =
      "#blogPosts.blog-list{display:grid!important;grid-template-columns:1fr!important;gap:24px;max-width:860px;margin-inline:auto}" +
      "#blogPosts .post-card{display:flex;flex-direction:column;padding:24px;border:1px solid var(--line,#e3e9f0);border-radius:var(--radius,12px);background:#fff;box-shadow:var(--shadow-sm,0 1px 3px rgba(11,31,51,.08))}" +
      "#blogPosts .post-card>.post-cover{order:-1;display:block;width:100%;height:auto;max-height:420px;object-fit:cover;border-radius:10px;margin:0 0 18px}" +
      "#blogPosts .read-post{align-self:flex-start}";
    document.head.appendChild(style);
  }

  function appendArticleContent(container, content) {
    var imagePattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
    var last = 0;
    var match;
    function addText(text) {
      text.split(/\n\s*\n/).forEach(function (paragraph) {
        if (paragraph.trim()) container.appendChild(el("p", "", paragraph.trim()));
      });
    }
    while ((match = imagePattern.exec(content)) !== null) {
      addText(content.slice(last, match.index));
      var figure = document.createElement("figure");
      var image = document.createElement("img");
      image.className = "post-image";
      image.src = match[2];
      image.alt = match[1];
      image.loading = "lazy";
      figure.appendChild(image);
      container.appendChild(figure);
      last = imagePattern.lastIndex;
    }
    addText(content.slice(last));
  }

  async function loadPublicPosts() {
    if (!client || !list) return;
    injectBlogStyles();
    var result = await client.from("blog_posts").select("id,title,excerpt,body,cover_image,created_at").eq("published", true).order("created_at", { ascending: false });
    list.replaceChildren();
    if (result.error) {
      console.error("Blog load error:", result.error);
      list.appendChild(el("p", "blog-status", "Articles are temporarily unavailable."));
      return;
    }
    if (!result.data.length) {
      list.appendChild(el("p", "blog-status", "No articles yet. Check back soon for new posts."));
      return;
    }
    result.data.forEach(function (post) {
      var card = el("article", "post-card");

      // Picture first: use the cover picture; if there is none, use the first picture inside the article.
      var coverUrl = post.cover_image;
      var coverAlt = "Cover image for " + post.title;
      var bodyText = post.body || "";
      if (!coverUrl) {
        var firstImage = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/.exec(bodyText);
        if (firstImage) {
          coverUrl = firstImage[2];
          coverAlt = firstImage[1] || coverAlt;
          bodyText = bodyText.replace(firstImage[0], "");
        }
      }
      if (coverUrl) {
        var cover = el("img", "post-cover");
        cover.src = coverUrl;
        cover.alt = coverAlt;
        cover.loading = "lazy";
        card.appendChild(cover);
      }

      var date = el("time", "", formatDate(post.created_at));
      date.dateTime = post.created_at;
      card.appendChild(date);
      card.appendChild(el("h2", "", post.title));
      if (post.excerpt) card.appendChild(el("p", "", post.excerpt));
      var body = el("div", "post-body");
      appendArticleContent(body, bodyText);
      body.hidden = true;
      var button = el("button", "read-post", "Read article →");
      button.type = "button";
      button.addEventListener("click", function () {
        body.hidden = !body.hidden;
        button.textContent = body.hidden ? "Read article →" : "Close article ↑";
      });
      card.appendChild(button);
      card.appendChild(body);
      list.appendChild(card);
    });
  }

  async function initEditor() {
    var loginPanel = document.getElementById("loginPanel");
    var editorPanel = document.getElementById("editorPanel");
    if (!loginPanel || !editorPanel) return;
    if (!client) { message("The editor could not connect. Please reload the page."); return; }

    var form = document.getElementById("postForm");
    var postList = document.getElementById("postList");
    var signOut = document.getElementById("signOut");
    var loginForm = document.getElementById("loginForm");

    function resetForm() {
      form.reset();
      document.getElementById("postId").value = "";
    }
    function fillForm(post) {
      document.getElementById("postId").value = post.id;
      document.getElementById("title").value = post.title;
      document.getElementById("excerpt").value = post.excerpt || "";
      document.getElementById("coverImage").value = post.cover_image || "";
      document.getElementById("body").value = post.body;
      document.getElementById("published").checked = post.published;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    async function refresh() {
      var sessionResult = await client.auth.getSession();
      var user = sessionResult.data.session && sessionResult.data.session.user;
      loginPanel.hidden = !!user;
      editorPanel.hidden = !user;
      signOut.hidden = !user;
      if (!user) { message("Sign in with your editor account to write and manage posts."); return; }
      message("Signed in as " + user.email + ". Drafts are private until published.");
      var result = await client.from("blog_posts").select("id,title,excerpt,body,cover_image,published,created_at").eq("author_id", user.id).order("created_at", { ascending: false });
      postList.replaceChildren();
      if (result.error) { message("Could not load posts: " + result.error.message); return; }
      if (!result.data.length) postList.appendChild(el("p", "muted", "Your posts will appear here."));
      result.data.forEach(function (post) {
        var row = el("div", "post-row");
        var label = el("span", "", post.title + (post.published ? " · Published" : " · Draft"));
        var actions = el("span");
        var edit = el("button", "secondary", "Edit");
        edit.type = "button";
        edit.addEventListener("click", function () { fillForm(post); });
        var remove = el("button", "danger", "Delete");
        remove.type = "button";
        remove.addEventListener("click", async function () {
          if (!window.confirm("Delete this post permanently?")) return;
          var deleted = await client.from("blog_posts").delete().eq("id", post.id);
          if (deleted.error) message("Could not delete post: " + deleted.error.message);
          else { message("Post deleted."); refresh(); }
        });
        actions.append(edit, remove);
        row.append(label, actions);
        postList.appendChild(row);
      });
    }

    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      message("Signing in…");
      try {
        var result = await client.auth.signInWithPassword({ email: document.getElementById("email").value, password: document.getElementById("password").value });
        if (result.error) { message("Sign in failed: " + result.error.message); return; }
        loginForm.reset();
        await refresh();
      } catch (error) {
        message("Could not sign in. Check your connection and Supabase settings, then try again.");
      }
    });
    signOut.addEventListener("click", async function () { await client.auth.signOut(); resetForm(); refresh(); });
    document.getElementById("newPost").addEventListener("click", resetForm);
    async function uploadSelectedImage(fileInput, purpose) {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
        message("Choose a JPG, PNG, WebP or GIF image no larger than 5 MB.");
        fileInput.value = "";
        return;
      }
      try {
        var current = await client.auth.getSession();
        var user = current.data.session && current.data.session.user;
        if (!user) { message("Sign in again before uploading an image."); return; }
        message("Uploading picture…");
        var extension = file.type.split("/")[1].replace("jpeg", "jpg");
        var path = user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + extension;
        var uploaded = await client.storage.from("blog-images").upload(path, file, { contentType: file.type, upsert: false });
        if (uploaded.error) {
          message("Picture upload failed: " + uploaded.error.message + ". Check that the blog-images bucket and storage policies are set up in blog-schema.sql.");
          return;
        }
        var publicUrl = client.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
        if (purpose === "cover") {
          document.getElementById("coverImage").value = publicUrl;
          message("Cover picture uploaded. Save the post to keep it.");
        } else {
          var alt = window.prompt("Describe the picture for accessibility:", file.name.replace(/\.[^.]+$/, "")) || "";
          var textarea = document.getElementById("body");
          var markdown = "![" + alt.replace(/[\]\r\n]/g, " ") + "](" + publicUrl + ")";
          var start = textarea.selectionStart;
          var end = textarea.selectionEnd;
          textarea.setRangeText((start > 0 && textarea.value[start - 1] !== "\n" ? "\n\n" : "") + markdown + "\n\n", start, end, "end");
          textarea.focus();
          message("Picture inserted in the article. Save the post to keep it.");
        }
      } catch (error) {
        message("Picture upload failed. Check your connection and blog image storage setup.");
      } finally {
        fileInput.value = "";
      }
    }
    document.getElementById("uploadCover").addEventListener("click", function () { document.getElementById("coverFile").click(); });
    document.getElementById("insertImage").addEventListener("click", function () { document.getElementById("inlineFile").click(); });
    document.getElementById("coverFile").addEventListener("change", function () { uploadSelectedImage(this, "cover"); });
    document.getElementById("inlineFile").addEventListener("change", function () { uploadSelectedImage(this, "inline"); });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var saveButton = form.querySelector('[type="submit"]');
      saveButton.disabled = true;
      try {
        var sessionResult = await client.auth.getSession();
        var user = sessionResult.data.session && sessionResult.data.session.user;
        if (!user) { message("Please sign in again to save."); await refresh(); return; }
        var id = document.getElementById("postId").value;
        var post = {
          title: document.getElementById("title").value.trim(),
          excerpt: document.getElementById("excerpt").value.trim(),
          cover_image: document.getElementById("coverImage").value.trim(),
          body: document.getElementById("body").value.trim(),
          published: document.getElementById("published").checked,
          author_id: user.id,
          updated_at: new Date().toISOString()
        };
        message("Saving post…");
        var query = id ? client.from("blog_posts").update(post).eq("id", id) : client.from("blog_posts").insert(post);
        var result = await query;
        if (result.error) {
          var detail = result.error.message || "Unknown database error.";
          if (/row-level security|permission denied/i.test(detail)) {
            detail += " Add your signed-in account to public.blog_editors using the SQL instructions in blog-schema.sql.";
          } else if (/blog_posts|schema cache|relation .* does not exist/i.test(detail)) {
            detail += " Run blog-schema.sql in the Supabase SQL Editor first.";
          }
          message("Could not save post: " + detail);
          return;
        }
        message(post.published ? "Post published." : "Draft saved.");
        resetForm();
        await refresh();
      } catch (error) {
        message("Could not save post. Check your connection and Supabase setup, then try again.");
      } finally {
        saveButton.disabled = false;
      }
    });
    client.auth.onAuthStateChange(function () { window.setTimeout(refresh, 0); });
    await refresh();
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  loadPublicPosts();
  initEditor();
}());