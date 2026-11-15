/**
 * Round 5.1 — /dev/ui-kit/requests vs ui-kit/ref (1440, no live DB).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r51/matching");
const REF_DIR = path.join(ROOT, "docs/ui/ui-kit/ref");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const FIXTURE_PATH = "/dev/ui-kit/requests";

const REGIONS = [
  { name: "sidebar", selector: ".rad-side, aside.rad-side, [data-portal='admin'] aside" },
  { name: "topbar", selector: ".rad-top, header.rad-top" },
  { name: "page-head", selector: ".rad-phead" },
  { name: "list-card", selector: "[data-admin-requests] .rad-card" },
];

function loadPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function crop(png, rect) {
  const { x, y, width, height } = rect;
  const out = new PNG({ width, height });
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const sx = x + col;
      const sy = y + row;
      if (sx >= png.width || sy >= png.height) continue;
      const si = (png.width * sy + sx) << 2;
      const di = (width * row + col) << 2;
      out.data[di] = png.data[si];
      out.data[di + 1] = png.data[si + 1];
      out.data[di + 2] = png.data[si + 2];
      out.data[di + 3] = png.data[si + 3];
    }
  }
  return out;
}

function matchPct(a, b, diffPath) {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const aa = a.width === w && a.height === h ? a : crop(a, { x: 0, y: 0, width: w, height: h });
  const bb = b.width === w && b.height === h ? b : crop(b, { x: 0, y: 0, width: w, height: h });
  const diff = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(aa.data, bb.data, diff.data, w, h, {
    threshold: 0.12,
    includeAA: true,
  });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return {
    pct: Number(((mismatched / (w * h)) * 100).toFixed(3)),
    mismatched,
    pixels: w * h,
    w,
    h,
  };
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') || document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, theme);
}

async function waitAnimationsIdle(page) {
  await page.evaluate(async () => {
    const finite = () =>
      document
        .getAnimations()
        .filter(
          (a) =>
            a.effect &&
            a.playState !== "finished" &&
            a.effect.getTiming().iterations !== Infinity
        );
    for (let i = 0; i < 8; i++) {
      const anims = finite();
      await Promise.all(anims.map((a) => a.finished.catch(() => {})));
      if (finite().length === 0) break;
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
    }
  });
  await page.waitForTimeout(200);
}

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}${FIXTURE_PATH}`, { waitUntil: "networkidle", timeout: 60000 });

const results = [];
for (const theme of ["dark", "light"]) {
  const tag = theme === "dark" ? "d" : "l";
  const refPath = path.join(REF_DIR, `admin-requests-list-${tag}.png`);
  if (!fs.existsSync(refPath)) {
    results.push({ theme, error: `missing ref ${refPath}` });
    continue;
  }

  await page.goto(`${BASE}${FIXTURE_PATH}`, { waitUntil: "networkidle", timeout: 60000 });
  await setTheme(page, theme);
  await hideNextDevIndicator(page);
  await waitAnimationsIdle(page);
  await page.waitForTimeout(200);

  const implPath = path.join(OUT, `impl-requests-fixture-${theme}-1440.png`);
  await page.screenshot({ path: implPath, fullPage: false });

  const ref = loadPng(refPath);
  const impl = loadPng(implPath);
  const full = matchPct(
    impl,
    ref,
    path.join(OUT, `diff-requests-fixture-${theme}-full.png`)
  );

  const regionRects = await page.evaluate((regions) => {
    return regions.map((r) => {
      const el = document.querySelector(r.selector);
      if (!el) return { name: r.name, missing: true };
      const b = el.getBoundingClientRect();
      return {
        name: r.name,
        x: Math.max(0, Math.round(b.x)),
        y: Math.max(0, Math.round(b.y)),
        width: Math.round(b.width),
        height: Math.round(b.height),
      };
    });
  }, REGIONS);

  const regions = [];
  for (const rect of regionRects) {
    if (rect.missing || rect.width < 4 || rect.height < 4) {
      regions.push({ name: rect.name, missing: true });
      continue;
    }
    const a = crop(impl, rect);
    const b = crop(ref, rect);
    const m = matchPct(
      a,
      b,
      path.join(OUT, `diff-requests-fixture-${theme}-${rect.name}.png`)
    );
    regions.push({
      name: rect.name,
      pct: m.pct,
      pass: m.pct <= 3,
      rect,
    });
  }

  const geometry = await page.evaluate(() => {
    const top = document.querySelector(".rad-top");
    const side = document.querySelector(".rad-side");
    const pageEl = document.querySelector(".rad-page");
    const row = document.querySelector(".rad-dt tbody tr");
    const g = (el, prop) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (prop === "height") return Math.round(r.height);
      if (prop === "width") return Math.round(r.width);
      if (prop === "paddingInline") {
        const cs = getComputedStyle(el);
        return Math.round(parseFloat(cs.paddingLeft) || 0);
      }
      return null;
    };
    return [
      { name: "topbar-height", actual: g(top, "height"), expected: 60 },
      { name: "sidebar-width", actual: g(side, "width"), expected: 268 },
      {
        name: "page-padding-inline",
        actual: g(pageEl, "paddingInline"),
        expected: 32,
      },
      { name: "table-row-height", actual: g(row, "height"), expected: 62 },
    ].map((x) => ({
      ...x,
      delta: x.actual == null ? null : Math.abs(x.actual - x.expected),
      pass: x.actual != null && Math.abs(x.actual - x.expected) <= 2,
    }));
  });

  results.push({
    path: FIXTURE_PATH,
    theme,
    viewport: "1440",
    fullPage: { pct: full.pct, pass: full.pct <= 2, threshold: 2 },
    regions,
    geometry,
    impl: path.relative(ROOT, implPath),
    ref: path.relative(ROOT, refPath),
  });
}

const outFile = path.join(OUT, "REQUESTS-MATCHING.json");
fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
