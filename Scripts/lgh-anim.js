/* =====================================================================
   Lifeway Global Harvest — scroll reveal animations
   Elements fade + rise into view as they enter the viewport. Pure
   progressive enhancement: if IntersectionObserver is unavailable or
   the user prefers reduced motion, nothing is hidden and content shows
   normally. Cards within a group stagger for a polished effect.
   ===================================================================== */
(function () {
  "use strict";

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SELECTOR = [
    ".lgh-section__head",
    ".lgh-card",
    ".lgh-feature__body",
    ".lgh-feature__art",
    ".lgh-stat",
    ".lgh-cta__inner",
    ".lgh-globe-band__inner",
    ".photoGalleryThumbs" // home service tiles get the same reveal
  ].join(",");

  function run() {
    if (reduce || !("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll(SELECTOR);
    if (!els.length) return;

    // Stagger cards / stats within each grid
    els.forEach(function (el) {
      el.classList.add("lgh-reveal");
      var parent = el.parentElement;
      if (parent && (el.classList.contains("lgh-card") || el.classList.contains("lgh-stat") || el.classList.contains("photoGalleryThumbs"))) {
        var idx = Array.prototype.indexOf.call(parent.children, el);
        el.style.transitionDelay = Math.min(idx, 5) * 80 + "ms";
      }
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("lgh-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState !== "loading") run();
  else document.addEventListener("DOMContentLoaded", run);

  /* -------------------------------------------------------------------
     FAQ accordion toggle. The Duda accordion widget doesn't bind in the
     static export, so we drive it ourselves: click a title to expand its
     description (height animates from 0 -> content height). One open at
     a time. Uses setProperty(..., important) to beat the base height:0.
     ------------------------------------------------------------------- */
  // The answer is collapsed on BOTH .accordion-description and its inner
  // .section (height:0 AND max-height:0, applied by the builder at runtime).
  // Inline !important styles are the only thing guaranteed to win, so we
  // set them directly on both elements.
  function style(item, open) {
    var desc = item.querySelector(".accordion-description");
    var section = desc && desc.querySelector(".section");
    var inner = desc && desc.querySelector(".section-inner");
    // explicit pixel height (auto ignores the inner's positioning)
    var h = inner ? inner.scrollHeight + 24 : (section ? section.scrollHeight : 0);
    [desc, section].forEach(function (el) {
      if (!el) return;
      if (open) {
        el.style.setProperty("height", h + "px", "important");
        el.style.setProperty("max-height", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
      } else {
        el.style.setProperty("height", "0px", "important");
        el.style.setProperty("max-height", "0px", "important");
        el.style.setProperty("overflow", "hidden", "important");
      }
    });
    item.classList.toggle("lgh-faq-open", open);
  }

  document.addEventListener("click", function (e) {
    var title = e.target.closest && e.target.closest(".accordion-title");
    if (!title) return;
    var item = title.closest(".accordion-item");
    if (!item) return;
    e.preventDefault();

    var willOpen = !item.classList.contains("lgh-faq-open");

    var wrap = item.closest(".accordion-wrapper");
    if (wrap) {
      wrap.querySelectorAll(".accordion-item.lgh-faq-open").forEach(function (o) {
        if (o !== item) style(o, false);
      });
    }
    style(item, willOpen);
  });
})();
