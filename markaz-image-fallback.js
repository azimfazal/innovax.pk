// Markaz exposes thumbnails and full-size product images under separate paths.
// Try the alternate public image URL before a product card is discarded.
(function () {
  const states = new WeakMap();
  const listeners = new WeakSet();

  function makeCandidates(source) {
    let url;
    try { url = new URL(source, document.baseURI); } catch { return []; }
    if (url.hostname !== "static.markaz.app") return [];
    const candidates = [];
    const add = value => { if (value !== source && !candidates.includes(value)) candidates.push(value); };
    if (url.pathname.includes("/thumbnails/products/")) add(url.href.replace("/thumbnails/products/", "/products/"));
    else if (url.pathname.includes("/products/")) add(url.href.replace("/products/", "/thumbnails/products/"));

    // Repair malformed gallery suffixes found in imported catalog URLs.
    const file = url.pathname.match(/^(.*-product-)(\d+)(\.[a-z0-9]+)$/i);
    if (file && Number(file[2]) > 100) {
      const corrected = new URL(url.href);
      corrected.pathname = `${file[1]}1${file[3]}`;
      add(corrected.href);
      if (corrected.pathname.includes("/thumbnails/products/")) add(corrected.href.replace("/thumbnails/products/", "/products/"));
      else if (corrected.pathname.includes("/products/")) add(corrected.href.replace("/products/", "/thumbnails/products/"));
    }
    return candidates;
  }

  function fail(image) {
    image.dispatchEvent(new CustomEvent("innovax:image-failed", { bubbles: true }));
    image.closest(".product, .trend-card, .shop-card")?.remove();
  }

  window.innovaxWatchMarkazImage = function (image) {
    if (!(image instanceof HTMLImageElement)) return;
    const source = image.currentSrc || image.src;
    try { if (new URL(source, document.baseURI).hostname !== "static.markaz.app") return; }
    catch { return; }
    let state = states.get(image);
    if (state && state.source === source) return;
    state = { source, candidates: makeCandidates(source), next: 0, failed: false };
    states.set(image, state);
    if (!listeners.has(image)) {
      listeners.add(image);
      image.addEventListener("error", function () {
        const currentState = states.get(image);
        if (currentState.next < currentState.candidates.length) image.src = currentState.candidates[currentState.next++];
        else if (!currentState.failed) { currentState.failed = true; fail(image); }
      });
    }
    if (image.complete && image.naturalWidth === 0) {
      if (state.next < state.candidates.length) image.src = state.candidates[state.next++];
      else { state.failed = true; fail(image); }
    }
  };

  function watchTree(root) {
    if (root instanceof HTMLImageElement) window.innovaxWatchMarkazImage(root);
    root.querySelectorAll?.("img").forEach(window.innovaxWatchMarkazImage);
  }
  watchTree(document);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) watchTree(node);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
