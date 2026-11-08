// RARE OUD — v3 motion (VISION.md section 4). Requires GSAP (+ ScrollTrigger
// where used). Damped, physical, purposeful. Every entry point is reduced-
// motion safe and re-initializes reliably (readyState check + pageshow).
(function () {
  "use strict";

  function reduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  // ---- count-up, IntersectionObserver-gated, readyState/pageshow-safe ----
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count-to"));
    if (isNaN(target)) return;
    if (el.dataset.counted === "1" && !el.dataset.recount) return; // avoid double-run same paint
    function run() {
      if (reduced()) { el.textContent = target.toLocaleString("en-US"); el.dataset.counted = "1"; return; }
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.1, ease: "power3.out",
        onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString("en-US"); },
        onComplete: function () { el.dataset.counted = "1"; }
      });
    }
    if (window.gsap) {
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { run(); io.unobserve(el); } });
        }, { threshold: 0.4 });
        io.observe(el);
      } else { run(); }
    } else { el.textContent = target.toLocaleString("en-US"); }
  }

  function initCountUps() { document.querySelectorAll("[data-count-to]").forEach(countUp); }

  // ---- ring ripple on click (section 2.1 "react ... ripple on clicks") ----
  function initRingRipple() {
    document.querySelectorAll(".ro-rings-live").forEach(function (svg) {
      svg.addEventListener("click", function (e) {
        if (reduced() || !window.gsap) return;
        var ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        var box = svg.viewBox.baseVal;
        var cx = box.width / 2, cy = box.height / 2;
        ring.setAttribute("cx", cx); ring.setAttribute("cy", cy); ring.setAttribute("r", box.width * 0.08);
        ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "currentColor"); ring.setAttribute("stroke-width", "1.5");
        ring.setAttribute("opacity", "0.9");
        svg.appendChild(ring);
        gsap.to(ring, {
          attr: { r: box.width * 0.52 }, opacity: 0, duration: 1.1, ease: "power2.out",
          onComplete: function () { ring.remove(); }
        });
      });
    });
  }

  // ---- waveform draw-in ----
  function initWaveformDraw() {
    document.querySelectorAll(".ro-waveform path").forEach(function (path) {
      var len = path.getTotalLength ? path.getTotalLength() : 400;
      path.style.strokeDasharray = len;
      if (reduced() || !window.gsap) { path.style.strokeDashoffset = 0; return; }
      path.style.strokeDashoffset = len;
      gsap.to(path, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", delay: .2 });
    });
  }

  // ---- entrance choreography (login/dashboard/home — one orchestrated sequence) ----
  function runChoreography(name) {
    if (!window.gsap) return;
    if (reduced()) {
      document.querySelectorAll("[data-choreo]").forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    document.querySelectorAll('[data-choreo="' + name + '"] [data-step]').forEach(function (el) {
      var step = parseFloat(el.getAttribute("data-step")) || 0;
      tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .7 }, step * 0.12);
    });
    return tl;
  }

  // ---- row/card stagger reveal (admin queue, trader stack) ----
  function initStagger() {
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var items = Array.from(group.children);
      if (reduced() || !window.gsap) { items.forEach(function (it) { it.style.opacity = 1; it.style.transform = "none"; }); return; }
      gsap.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, stagger: .07, ease: "power2.out", delay: .1 });
    });
  }

  // ---- chart draw helpers (Chart.js config reads CSS custom properties) ----
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  window.roChartTheme = function (inverse) {
    return {
      grid: cssVar(inverse ? "--ro-chart-grid" : "--ro-chart-grid-light"),
      line: cssVar("--ro-chart-line"),
      fillFrom: cssVar("--ro-chart-fill-from"),
      fillTo: cssVar("--ro-chart-fill-to"),
      amber: cssVar("--ro-chart-amber"),
      label: cssVar(inverse ? "--ro-chart-label" : "--ro-chart-label-light"),
      font: getComputedStyle(document.body).fontFamily
    };
  };

  window.roMotion = { countUp: countUp, initCountUps: initCountUps, runChoreography: runChoreography, initStagger: initStagger, reduced: reduced };

  function boot() {
    initCountUps();
    initRingRipple();
    initWaveformDraw();
    initStagger();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      document.querySelectorAll("[data-count-to]").forEach(function (el) { el.dataset.counted = ""; });
      boot();
    }
  });
})();
