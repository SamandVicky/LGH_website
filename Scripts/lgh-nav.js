/* =====================================================================
   Lifeway Global Harvest — sticky header contrast
   The header sits transparently over the hero with white nav text
   ("header-over-content"). Once the page moves onto the light sections
   below, that white text becomes unreadable. This gives the fixed
   header a solid background as soon as the page leaves the very top.

   Uses an IntersectionObserver sentinel so it works no matter HOW the
   page scrolls (native window scroll, body scroll, anchor-jump, or the
   builder's own animated scroll) — a plain scroll listener misses some
   of those. A capture-phase scroll listener is kept as a fallback.

   CSS in Style/desktop.css & tablet.css keys off the .lgh-scrolled class.
   ===================================================================== */
(function () {
  "use strict";
  var OFFSET = 80; // px from the top before the header turns solid

  function setup() {
    var header = document.querySelector(".dmHeaderContainer");
    if (!header) return;

    var host =
      document.getElementById("site_content") ||
      document.getElementById("iscrollBody") ||
      document.body;

    // 1px, layout-neutral marker at the very top of the content
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "width:100%;height:1px;margin:0;padding:0;border:0;pointer-events:none;";
    host.insertBefore(sentinel, host.firstChild);

    function solid(on) {
      header.classList.toggle("lgh-scrolled", on);
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          solid(!entries[0].isIntersecting);
        },
        { rootMargin: "-" + OFFSET + "px 0px 0px 0px", threshold: 0 }
      );
      io.observe(sentinel);
    }

    // Fallback: catches scrolls on any element (capture phase)
    function onScroll(e) {
      var y = Math.max(
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
        (e && e.target && e.target.scrollTop) || 0
      );
      if (y > OFFSET) solid(true);
      else if (y <= 4) solid(false);
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("load", onScroll);
  }

  if (document.readyState !== "loading") setup();
  else document.addEventListener("DOMContentLoaded", setup);
})();
