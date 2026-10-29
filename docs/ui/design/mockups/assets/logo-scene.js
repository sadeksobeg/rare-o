// RARE OUD — Three.js signature moment: the REAL brand mark (traced from
// public/brand/mark-master.png, not a downloaded 3D asset) extruded into
// a lit, slowly-rotating 3D object with soft dust particles.
// ES module. Requires an importmap mapping "three" before this script tag.
// Exposes window.roLogoScene(canvas, opts) -> { dispose() } or null on failure.
import * as THREE from "three";
import { SVGLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/SVGLoader.js";

window.roLogoScene = function (canvas, opts) {
  opts = opts || {};
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return null; // caller shows the static SVG instead

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  } catch (e) { return null; }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  var group = new THREE.Group();
  scene.add(group);

  var loader = new SVGLoader();
  var disposed = false;
  var raf = null;

  loader.load(opts.svgUrl || "assets/logo-mark.svg", function (data) {
    if (disposed) return;
    var paths = data.paths;
    var material = new THREE.MeshStandardMaterial({
      color: opts.color || 0x32104f, metalness: 0.35, roughness: 0.4
    });
    var extrudeSettings = { depth: 14, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1, bevelSegments: 3, curveSegments: 8 };
    var box = new THREE.Box3();
    var tmp = new THREE.Group();

    paths.forEach(function (path) {
      var shapes = SVGLoader.createShapes(path);
      shapes.forEach(function (shape) {
        var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        var mesh = new THREE.Mesh(geometry, material);
        tmp.add(mesh);
      });
    });

    box.setFromObject(tmp);
    var center = new THREE.Vector3();
    box.getCenter(center);
    var size = new THREE.Vector3();
    box.getSize(size);
    var scale = 11 / Math.max(size.x, size.y);
    tmp.children.forEach(function (mesh) {
      mesh.position.set(-center.x, -center.y, -center.z);
    });
    tmp.scale.setScalar(scale);
    tmp.rotation.x = Math.PI; // SVG y-down -> three y-up
    group.add(tmp);
  });

  var key = new THREE.DirectionalLight(0xf4e7d8, 2.2);
  key.position.set(5, 6, 8);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0xc9b2e3, 1.4);
  rim.position.set(-6, -3, -4);
  scene.add(rim);
  var amb = new THREE.AmbientLight(0x3a2a4a, 0.9);
  scene.add(amb);

  // soft dust particles
  var particleCount = 120;
  var positions = new Float32Array(particleCount * 3);
  for (var i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  var pMat = new THREE.PointsMaterial({ color: 0xf4e7d8, size: 0.06, transparent: true, opacity: 0.5 });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  var visible = true;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible = e.isIntersecting; });
  });
  io.observe(canvas);

  var clock = new THREE.Clock();
  function tick() {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    var t = clock.getElapsedTime();
    group.rotation.y = t * 0.25;
    group.rotation.x = Math.sin(t * 0.3) * 0.08;
    particles.rotation.y = t * 0.05;
    renderer.render(scene, camera);
  }
  tick();

  return {
    dispose: function () {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      renderer.dispose();
    }
  };
};

window.dispatchEvent(new Event("ro-logo-scene-ready"));
