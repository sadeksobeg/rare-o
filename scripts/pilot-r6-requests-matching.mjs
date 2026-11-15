/**
 * Round 6 matching: baseline from ui-kit HTML with omitted chrome hidden,
 * vs live /dev/ui-kit/requests.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { pathToFileURL } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6/matching");
const HTML = path.join(ROOT, "docs/ui/ui-kit/admin-requests-list.html");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const FIXTURE = "/dev/ui-kit/requests";

const HIDE_OMITTED = `
  /* Owner-omitted: checkbox, source column, bulk, export/new */
  .rad-dt th.rad-c1, .rad-dt td.rad-c1,
  thead th:first-child, tbody td:first-child { display: none !important; }
  .rad-dt th:nth-child(8), .rad-dt td:nth-child(8),
  th.src, td .src, .src { display: none !important; }
  #bulk, .rad-bulk, .rad-bulkw, .bulk { display: none !important; }
  .rad-pact .rad-btn, header .btn, .pact a.btn, [data-export], [data-new] {
    /* keep page actions if present; hide reference-only export/new in HTML */
  }
  .pact .btn, header .pact button, .ch .dens { }
  /* Hide reference HTML export / new if classed as such */
  button[data-mo], .bulk, #bc { display: none !important; }
`;

fs.mkdirSync(OUT, { recursive: true });

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
  return { pct: Number(((mismatched / (w * h)) * 100).toFixed(3)) };
}

async function waitIdle(page) {
  await page.evaluate(async () => {
    const finite = () =>
      document.getAnimations().filter(
        (a) => a.effect && a.playState !== "finished" && a.effect.getTiming().iterations !== Infinity
      );
    for (let i = 0; i < 6; i++) {
      await Promise.all(finite().map((a) => a.finished.catch(() => {})));
      if (!finite().length) break;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
  });
  await page.waitForTimeout(200);
}

async function setTheme(page, theme) {
  // PortalThemeProvider owns data-theme via React + localStorage.
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  const current = await page.evaluate(() => {
    const root = document.querySelector("[data-portal='admin']");
    return root?.getAttribute("data-theme") || "dark";
  });
  if (current !== theme) {
    // Toggle once via the topbar control (avoids reload races → 404).
    const btn = page.locator(".rad-top button[data-tip]").filter({
      has: page.locator("svg"),
    });
    // Sun/Moon is the theme control — match by aria-pressed presence.
    const themeBtn = page.locator(".rad-top button[aria-pressed]");
    if ((await themeBtn.count()) > 0) {
      await themeBtn.first().click();
    } else {
      // Fallback: click the button whose tip is المظهر / Theme
      await page.locator(".rad-top button").nth(1).click();
    }
    void btn;
  }
  await page.waitForFunction(
    (t) => {
      const root = document.querySelector("[data-portal='admin']");
      return root?.getAttribute("data-theme") === t;
    },
    theme,
    { timeout: 10000 }
  );
}

async function setHtmlTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
}

const REGIONS = [
  { name: "sidebar", selector: ".rad-side, .side, aside" },
  { name: "topbar", selector: ".rad-top, .top, header.top" },
  { name: "page-head", selector: ".rad-phead, .phead, header.rad-phead" },
  { name: "list-card", selector: "[data-admin-requests] .rad-card, .card, main .rad-card" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];

for (const theme of ["dark", "light"]) {
  const htmlUrl = pathToFileURL(HTML).href;

  // Live fixture first (stable shell)
  await page.goto(`${BASE}${FIXTURE}`, { waitUntil: "networkidle", timeout: 60000 });
  await setTheme(page, theme);
  await hideNextDevIndicator(page);
  await waitIdle(page);
  const implPath = path.join(OUT, `impl-requests-${theme}-1440.png`);
  await page.screenshot({ path: implPath, fullPage: false });
  const regionRects = await page.evaluate((regions) =>
    regions.map((r) => {
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
    })
  , REGIONS);

  // Baseline from HTML with omitted chrome hidden
  await page.goto(htmlUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".app, .side, .rad-side", { timeout: 15000 });
  await setHtmlTheme(page, theme);
  await page.addStyleTag({ content: HIDE_OMITTED });
  // Hide reference-only page actions (export / manual new) for fair compare
  await page.addStyleTag({
    content: `
      .pact .btn, header .pact a.btn, .pact button { display: none !important; }
      .dens, [data-density] { display: none !important; }
    `,
  });
  await waitIdle(page);
  const basePath = path.join(OUT, `baseline-requests-${theme}-1440.png`);
  await page.screenshot({ path: basePath, fullPage: false });
  const baseRects = await page.evaluate((regions) =>
    regions.map((r) => {
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
    })
  , REGIONS);

  const ref = loadPng(basePath);
  const impl = loadPng(implPath);
  const full = matchPct(impl, ref, path.join(OUT, `diff-requests-${theme}-full.png`));

  const regions = [];
  for (let i = 0; i < REGIONS.length; i++) {
    const aRect = regionRects[i];
    const bRect = baseRects[i];
    if (aRect?.missing || bRect?.missing) {
      regions.push({ name: REGIONS[i].name, missing: true });
      continue;
    }
    const a = crop(impl, aRect);
    const b = crop(ref, bRect);
    const m = matchPct(a, b, path.join(OUT, `diff-requests-${theme}-${REGIONS[i].name}.png`));
    regions.push({
      name: REGIONS[i].name,
      pct: m.pct,
      pass: m.pct <= 3,
      implRect: aRect,
      baseRect: bRect,
    });
  }

  await page.goto(`${BASE}${FIXTURE}`, { waitUntil: "networkidle" });
  await setTheme(page, theme);
  await hideNextDevIndicator(page);
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
        return Math.round(parseFloat(getComputedStyle(el).paddingLeft) || 0);
      }
      return null;
    };
    return [
      { name: "topbar-height", actual: g(top, "height"), expected: 60 },
      { name: "sidebar-width", actual: g(side, "width"), expected: 268 },
      { name: "page-padding-inline", actual: g(pageEl, "paddingInline"), expected: 32 },
      { name: "table-row-height", actual: g(row, "height"), expected: 62 },
    ].map((x) => ({
      ...x,
      delta: x.actual == null ? null : Math.abs(x.actual - x.expected),
      pass: x.actual != null && Math.abs(x.actual - x.expected) <= 2,
    }));
  });

  results.push({
    theme,
    fullPage: { pct: full.pct, pass: full.pct <= 2, threshold: 2 },
    regions,
    geometry,
    baseline: path.relative(ROOT, basePath),
    impl: path.relative(ROOT, implPath),
  });
}

fs.writeFileSync(path.join(OUT, "REQUESTS-MATCHING.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
