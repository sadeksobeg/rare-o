/**
 * SELF-TEST: /dev/gate-self-test must FAIL the pixel + lavender gates.
 * Proves the gate no longer false-passes dark-on-dark / lavender / gradient labels.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });

function relLum({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a, b) {
  return (Math.max(relLum(a), relLum(b)) + 0.05) / (Math.min(relLum(a), relLum(b)) + 0.05);
}
function sample(png, x, y) {
  const sx = Math.max(0, Math.min(png.width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(png.height - 1, Math.round(y)));
  const i = (png.width * sy + sx) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}
function parseCssRgb(str) {
  const m = String(str).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}
function rgbDist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

const LAVENDER = { r: 76, g: 70, b: 102 };

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 900, height: 700 },
  deviceScaleFactor: 1,
});
await page.goto(`${BASE}/dev/gate-self-test`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

const targets = await page.evaluate(() => {
  return [...document.querySelectorAll("[data-gate-bad]")].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const kind = el.getAttribute("data-gate-bad");
    let color = cs.color;
    if (el.tagName === "SVG") {
      color = cs.stroke && cs.stroke !== "none" ? cs.stroke : cs.color;
    }
    return {
      kind,
      text: (el.innerText || kind).trim().slice(0, 40),
      color,
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      center: [r.x + r.width / 2, r.y + r.height / 2],
      // Cream end of plum→cream (end-inline for LTR gradient approx).
      edge: [r.x + r.width * 0.85, r.y + r.height / 2],
    };
  });
});

const shotPath = path.join(OUT, "_gate-self-test.png");
await page.screenshot({ path: shotPath, fullPage: true });
const png = PNG.sync.read(fs.readFileSync(shotPath));

const fails = [];
for (const t of targets) {
  const fg = parseCssRgb(t.color);
  if (!fg) continue;
  const centerBg = sample(png, t.center[0], t.center[1]);
  const edgeBg = sample(png, t.edge[0], t.edge[1]);
  const centerRatio = contrastRatio(fg, centerBg);
  const edgeRatio = contrastRatio(fg, edgeBg);
  const worst = Math.min(centerRatio, edgeRatio);
  // Icons: non-text ≥3:1. Dark stroke on dark pad is intentionally ~1:1.
  const min = t.kind === "icon-low-contrast" ? 3 : 4.5;
  const contrastFail = worst < min;
  const lavDist = rgbDist(centerBg, LAVENDER);
  const lavenderFail =
    t.kind === "lavender-tile" &&
    (lavDist < 40 ||
      (t.bgImage && t.bgImage.includes("gradient") && lavDist < 80));

  if (contrastFail || lavenderFail) {
    fails.push({
      kind: t.kind,
      text: t.text,
      worstRatio: Number(worst.toFixed(2)),
      min,
      contrastFail,
      lavenderFail,
      lavDist: Number(lavDist.toFixed(2)),
      bgImage: t.bgImage,
    });
  }
}

const expectedKinds = [
  "dark-on-dark",
  "button-on-gradient",
  "lavender-tile",
  "icon-low-contrast",
  "nego-terms",
];
const caught = new Set(fails.map((f) => f.kind));
const missed = expectedKinds.filter((k) => !caught.has(k));

const passSelfTest = fails.length >= 3 && missed.length === 0;
const payload = {
  generatedAt: new Date().toISOString(),
  intent: "Gate must FAIL on known-bad /dev/gate-self-test samples",
  selfTestPass: passSelfTest,
  catches: fails,
  missed,
  note: passSelfTest
    ? "SELF-TEST OK — gate correctly fails on injected defects"
    : "SELF-TEST WEAK — gate missed some injected defects",
};

fs.writeFileSync(
  path.join(OUT, "gate-self-test.json"),
  JSON.stringify(payload, null, 2)
);
console.log(JSON.stringify(payload, null, 2));
await browser.close();
process.exit(passSelfTest ? 0 : 1);
