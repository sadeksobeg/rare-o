/**
 * Slim R7 pixel contrast — key admin+trader dark 1440 routes only.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r7");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_") || k.startsWith("TRADER_")) {
    process.env[k] = v;
  }
}

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

async function login(page, pathLogin, email, password) {
  await page.goto(`${BASE}${pathLogin}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
}

const ROUTES_ADMIN = [
  "/admin",
  "/admin/profile",
  "/admin/settings",
  "/admin/traders",
  "/admin/brokerage",
];
const ROUTES_TRADER = ["/trader", "/trader/deals", "/trader/profile"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ar" });
await page.addInitScript(() => localStorage.setItem("ro-portal-theme-v5", "dark"));

await login(page, "/admin/login", process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);

const byRoute = {};
let failCount = 0;
let checkCount = 0;

async function scan(route) {
  byRoute[route] = { fails: [], minRatio: null, checks: 0 };
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"], .rad-sk')).catch(() => {});
  await hideNextDevIndicator(page);
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
  const buf = await page.screenshot({ type: "png" });
  const png = PNG.sync.read(buf);
  const targets = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll(
      "label, button, .rad-pill, .rad-btn, h1, h2, p, a, .rad-tx3"
    )) {
      if (!(el instanceof HTMLElement)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const cs = getComputedStyle(el);
      const color = cs.color;
      const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) continue;
      out.push({
        text: (el.innerText || "").slice(0, 40),
        x: r.left + r.width / 2,
        y: r.top + Math.min(r.height / 2, 10),
        fg: { r: +m[1], g: +m[2], b: +m[3] },
        tag: el.tagName,
      });
      if (out.length >= 80) break;
    }
    return out;
  });
  for (const t of targets) {
    const bg = sample(png, t.x, t.y);
    // sample near text: try a few offsets for bg under glyph
    const samples = [
      sample(png, t.x, t.y + 12),
      sample(png, t.x - 8, t.y + 12),
      sample(png, t.x + 8, t.y + 12),
    ];
    let worst = Infinity;
    for (const s of samples) {
      const ratio = contrastRatio(t.fg, s);
      if (ratio < worst) worst = ratio;
    }
    checkCount += 1;
    byRoute[route].checks += 1;
    if (byRoute[route].minRatio == null || worst < byRoute[route].minRatio) {
      byRoute[route].minRatio = Number(worst.toFixed(2));
    }
    if (worst < 4.5 && t.tag !== "SVG") {
      failCount += 1;
      if (byRoute[route].fails.length < 5) {
        byRoute[route].fails.push({
          text: t.text,
          ratio: Number(worst.toFixed(2)),
          tag: t.tag,
        });
      }
    }
  }
}

for (const r of ROUTES_ADMIN) await scan(r);

const ctx = page.context();
await ctx.clearCookies();
await login(
  page,
  "/trader/login",
  process.env.TRADER_EMAIL || "trader@rareoud.local",
  process.env.TRADER_PASSWORD || "ChangeMeNow!"
);
for (const r of ROUTES_TRADER) await scan(r);

const summary = {
  at: new Date().toISOString(),
  checks: checkCount,
  fails: failCount,
  ok: failCount === 0,
  byRoute,
};
fs.writeFileSync(path.join(OUT, "pixel-contrast-gate.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ checks: checkCount, fails: failCount, ok: failCount === 0 }, null, 2));
await browser.close();
