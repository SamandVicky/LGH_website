/*
 * lgh-device.js — routes visitors to the correct device layout.
 *
 * This is a static Duda export: every page exists as a desktop copy
 * (/Pages/desktop/<page>/) and a phone copy (/Pages/mobile/<page>/).
 * Nothing routed phones to the mobile copies, so phone visitors were
 * stuck on the desktop layout (content clipped, no hamburger). This
 * script sends phones into the mobile tree and everything else into
 * the desktop tree, preserving the current page, hash and query.
 *
 * Loop-safe: the phone test uses the physical screen short-edge + UA
 * (both stable for a given device), NOT window width, so resizing or
 * rotating a browser can never bounce a visitor back and forth.
 */
(function () {
  var ua = navigator.userAgent || "";
  var uaPhone = /Android.*Mobile|iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua);
  var shortEdge = Math.min(screen.width || 9999, screen.height || 9999);
  var isPhone = uaPhone || shortEdge < 768;

  var href = location.href;
  if (isPhone && href.indexOf("/Pages/desktop/") !== -1) {
    location.replace(href.replace("/Pages/desktop/", "/Pages/mobile/"));
  } else if (!isPhone && href.indexOf("/Pages/mobile/") !== -1) {
    location.replace(href.replace("/Pages/mobile/", "/Pages/desktop/"));
  }
})();
