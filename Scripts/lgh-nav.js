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

/* ------------------------------------------------------------------
   Mobile hamburger drawer toggle.
   The Duda runtime that normally binds #layout-drawer-hamburger is
   not part of this static export, so we drive the drawer ourselves:
   toggle .layout-drawer_open on #dm-outer-wrapper (styled in
   lgh-enhance.css). No-ops on desktop pages, where these IDs are
   absent.
   ------------------------------------------------------------------ */
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    var burger = document.getElementById("layout-drawer-hamburger");
    var drawer = document.getElementById("mobile-hamburger-drawer");
    if (!burger || !drawer) return; // desktop layout: nothing to do

    // Move the drawer to <body> so its position:fixed escapes the
    // transformed ancestor that otherwise traps it behind the page.
    if (drawer.parentNode !== document.body) document.body.appendChild(drawer);

    // Inject a close (X) button since the header row is covered when open.
    var close = document.createElement("button");
    close.className = "lgh-drawer-close";
    close.setAttribute("aria-label", "Close menu");
    close.setAttribute("type", "button");
    close.innerHTML = "×";
    drawer.insertBefore(close, drawer.firstChild);

    function setOpen(open) {
      drawer.classList.toggle("lgh-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }

    burger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(!drawer.classList.contains("lgh-open"));
    });
    close.addEventListener("click", function () { setOpen(false); });

    // tapping any link in the drawer closes it (so same-page anchors work)
    drawer.addEventListener("click", function (e) {
      var t = e.target;
      while (t && t !== drawer) {
        if (t.tagName === "A") { setOpen(false); break; }
        t = t.parentNode;
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) setOpen(false);
    });
  });
})();
