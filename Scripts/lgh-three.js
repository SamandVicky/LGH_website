/* =====================================================================
   Lifeway Global Harvest — lightweight Three.js backgrounds
   Self-contained. Loads Three.js (r128 UMD) from CDN on demand and
   mounts an animated background on any <canvas data-lgh-three="...">.
   Effects: "globe"  -> rotating wireframe world + glowing point cloud
            "field"  -> gently drifting particle field ("harvest light")
   Degrades gracefully: if Three fails to load or the user prefers
   reduced motion, the underlying CSS gradient simply shows through.
   ===================================================================== */
(function () {
  "use strict";

  var THREE_SRC =
    window.__lghThreeSrc ||
    "/Scripts/three.min.js";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function loadThree(cb) {
    if (window.THREE) return cb(window.THREE);
    var s = document.createElement("script");
    s.src = THREE_SRC;
    s.async = true;
    s.onload = function () { cb(window.THREE); };
    s.onerror = function () { cb(null); };
    document.head.appendChild(s);
  }

  function init() {
    if (prefersReduced) return;
    var canvases = document.querySelectorAll("canvas[data-lgh-three]");
    if (!canvases.length) return;

    loadThree(function (THREE) {
      if (!THREE) return; // CSS gradient remains as fallback
      canvases.forEach(function (canvas) {
        try {
          var kind = canvas.getAttribute("data-lgh-three");
          if (kind === "globe") mountGlobe(THREE, canvas);
          else mountField(THREE, canvas);
        } catch (e) {
          /* leave the gradient in place */
        }
      });
    });
  }

  /* ---- shared plumbing ---------------------------------------------- */
  function makeRenderer(THREE, canvas) {
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    return renderer;
  }

  function sizeOf(canvas) {
    var p = canvas.parentElement || canvas;
    var w = p.clientWidth || window.innerWidth;
    var h = p.clientHeight || Math.round(window.innerHeight * 0.6);
    return { w: w, h: h };
  }

  /* ---- Effect 1: rotating world + glowing points -------------------- */
  function mountGlobe(THREE, canvas) {
    var renderer = makeRenderer(THREE, canvas);
    var scene = new THREE.Scene();
    var s = sizeOf(canvas);
    var camera = new THREE.PerspectiveCamera(45, s.w / s.h, 0.1, 100);
    camera.position.z = 5.2;

    var group = new THREE.Group();
    scene.add(group);

    var GOLD = 0xe2be6a;
    var STEEL = 0x5b7aa6;

    // Wireframe sphere
    var R = 1.9;

    // Soft atmospheric halo behind the globe
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeRadialSprite(THREE, [
        [0.0, "rgba(150,190,255,0.40)"],
        [0.45, "rgba(96,140,215,0.16)"],
        [1.0, "rgba(96,140,215,0)"]
      ]),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    glow.scale.set(8.2, 8.2, 1);
    scene.add(glow);

    // Faint wireframe sphere
    var wire = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 40, 28),
      new THREE.MeshBasicMaterial({ color: STEEL, wireframe: true, transparent: true, opacity: 0.16 })
    );
    group.add(wire);

    var dot = makeGlowSprite(THREE); // round soft sprite for glowing points

    // Glowing "city-light" points over the sphere surface
    var count = 1400;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var phi = Math.acos(2 * Math.random() - 1);
      var theta = 2 * Math.PI * Math.random();
      positions[i * 3]     = R * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = R * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = R * Math.cos(phi);
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var points = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: GOLD, size: 0.11, map: dot, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    }));
    group.add(points);

    // Inner sparkle layer (cool white) for depth
    var sc = 500;
    var sPos = new Float32Array(sc * 3);
    for (var k = 0; k < sc; k++) {
      var p2 = Math.acos(2 * Math.random() - 1), th2 = 2 * Math.PI * Math.random();
      sPos[k * 3]     = R * Math.sin(p2) * Math.cos(th2);
      sPos[k * 3 + 1] = R * Math.sin(p2) * Math.sin(th2);
      sPos[k * 3 + 2] = R * Math.cos(p2);
    }
    var sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    var sparkle = new THREE.Points(sGeo, new THREE.PointsMaterial({
      color: 0xdff0ff, size: 0.05, map: dot, transparent: true, opacity: 0.6,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    group.add(sparkle);

    // Thin orbit rings
    for (var ri = 0; ri < 3; ri++) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.05 + ri * 0.12, 0.004, 8, 120),
        new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22 })
      );
      ring.rotation.x = 1.2 + ri * 0.5;
      ring.rotation.y = ri * 0.7;
      group.add(ring);
    }

    // Outer drifting motes
    var halo = 300;
    var hPos = new Float32Array(halo * 3);
    for (var j = 0; j < halo; j++) {
      var rad = 2.6 + Math.random() * 2.6;
      var a = Math.random() * Math.PI * 2, b = (Math.random() - 0.5) * Math.PI;
      hPos[j * 3]     = rad * Math.cos(b) * Math.cos(a);
      hPos[j * 3 + 1] = rad * Math.sin(b);
      hPos[j * 3 + 2] = rad * Math.cos(b) * Math.sin(a);
    }
    var hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute("position", new THREE.BufferAttribute(hPos, 3));
    var motes = new THREE.Points(hGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.035, map: dot, transparent: true, opacity: 0.4,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(motes);

    group.rotation.x = 0.35;

    var pointer = { x: 0, y: 0 };
    window.addEventListener("mousemove", function (e) {
      pointer.x = (e.clientX / window.innerWidth - 0.5);
      pointer.y = (e.clientY / window.innerHeight - 0.5);
    });

    function resize() {
      var z = sizeOf(canvas);
      renderer.setSize(z.w, z.h, false);
      camera.aspect = z.w / z.h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    (function loop() {
      requestAnimationFrame(loop);
      group.rotation.y += 0.0016;
      sparkle.rotation.y += 0.0004;
      motes.rotation.y -= 0.0006;
      group.rotation.x += (0.35 + pointer.y * 0.32 - group.rotation.x) * 0.03;
      camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.03;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    })();
  }

  /* ---- Effect 2: drifting harvest-light field ----------------------- */
  function mountField(THREE, canvas) {
    var renderer = makeRenderer(THREE, canvas);
    var scene = new THREE.Scene();
    var s = sizeOf(canvas);
    var camera = new THREE.PerspectiveCamera(60, s.w / s.h, 0.1, 100);
    camera.position.z = 6;

    var count = 700;
    var pos = new Float32Array(count * 3);
    var spd = new Float32Array(count);
    var spread = 14;
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      spd[i] = 0.004 + Math.random() * 0.01;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    var sprite = makeGlowSprite(THREE);
    var particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xe2be6a,
        size: 0.16,
        map: sprite,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    scene.add(particles);

    var pointer = { x: 0, y: 0 };
    window.addEventListener("mousemove", function (e) {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    });

    function resize() {
      var z = sizeOf(canvas);
      renderer.setSize(z.w, z.h, false);
      camera.aspect = z.w / z.h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    var arr = geo.attributes.position.array;
    (function loop() {
      requestAnimationFrame(loop);
      for (var i = 0; i < count; i++) {
        arr[i * 3 + 1] += spd[i]; // drift upward
        if (arr[i * 3 + 1] > spread / 2) arr[i * 3 + 1] = -spread / 2;
      }
      geo.attributes.position.needsUpdate = true;
      particles.rotation.y += 0.0004;
      camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.02;
      camera.position.y += (-pointer.y * 1.2 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    })();
  }

  function makeRadialSprite(THREE, stops) {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    var tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function makeGlowSprite(THREE) {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,246,220,1)");
    g.addColorStop(0.3, "rgba(226,190,106,0.9)");
    g.addColorStop(1, "rgba(226,190,106,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    var tex = new THREE.Texture(c);
    tex.needsUpdate = true;
    return tex;
  }

  ready(init);
})();
