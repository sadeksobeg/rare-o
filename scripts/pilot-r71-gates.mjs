/**
 * Round 7.1 gates — extended lavender (page bg), axe, pixel, SyntaxError source.
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { PNG } from "pngjs";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r71");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (
    !(k in process.env) ||
    !process.env[k] ||
    k.startsWith("ADMIN_") ||
    k.startsWith("TRADER_")
  ) {
    process.env[k] = v;
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";
const LAV = { r: 76, g: 70, b: 102 }; // #4c4666
const LAV2 = { r: 55, g: 46, b: 76 }; // #372e4c

function writeJson(name, data) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2));
  console.log("wrote", name);
}

function parseRgb(s) {
  const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
}
function dist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
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
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2], a: png.data[i + 3] };
}

async function login(page, loginPath, email, password) {
  await page.goto(`${BASE}${loginPath}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
}

async function settle(page) {
  await page
    .waitForFunction(
      () => !document.querySelector('[aria-busy="true"], .rad-sk, .ro-skeleton'),
      { timeout: 30000 }
    )
    .catch(() => {});
  await hideNextDevIndicator(page);
}

// Self-test copy
{
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "scripts/pilot-r6-gate-self-test.mjs")],
    { cwd: ROOT, encoding: "utf8", env: process.env }
  );
  const src = path.join(ROOT, "docs/ui/pilot-r6/gate-self-test.json");
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, "gate-self-test.json"));
  console.log("self-test exit", r.status);
}

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
});

// —— Lavender incl. page background ——
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ar" });
  await page.addInitScript(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
  await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);
  const routes = ["/trader", "/trader/deals", "/trader/profile", "/trader/deals/new"];
  const hits = [];
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page);
    const probe = await page.evaluate(
      ({ lav, lav2 }) => {
        function dist(a, b) {
          return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
        }
        function parse(s) {
          const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
        }
        const out = [];
        const root =
          document.querySelector(".ro-portal[data-portal='trader']") ||
          document.body;
        const cs = getComputedStyle(root);
        const bg = parse(cs.backgroundColor);
        const bi = cs.backgroundImage || "";
        if (bg && (dist(bg, lav) < 28 || dist(bg, lav2) < 28)) {
          out.push({ kind: "page-bg-color", bg, bi: bi.slice(0, 120) });
        }
        if (/gradient/i.test(bi) && /122,\s*68,\s*179|76,\s*70,\s*102|4c4666|7a44b3/i.test(bi)) {
          out.push({ kind: "page-bg-gradient", bi: bi.slice(0, 180) });
        }
        for (const el of document.querySelectorAll(
          ".ro-portal-icon-well, .rad-pt, [class*='icon-well']"
        )) {
          const c = parse(getComputedStyle(el).backgroundColor);
          if (c && (dist(c, lav) < 18 || dist(c, lav2) < 18)) {
            out.push({ kind: "icon-tile", cls: el.className?.toString?.().slice(0, 60) });
            if (out.length > 12) break;
          }
        }
        for (const el of document.querySelectorAll(
          "[role='alert'], .ro-banner, .rad-banner, .Banner"
        )) {
          const c = parse(getComputedStyle(el).backgroundColor);
          // pale beige on dark: high L relative to dark page
          if (c && c.r > 200 && c.g > 180 && c.b > 150) {
            out.push({ kind: "light-alert-on-dark", bg: c });
          }
        }
        return out;
      },
      { lav: LAV, lav2: LAV2 }
    );
    if (probe.length) hits.push({ route, probe });
  }
  writeJson("lavender-contrast-gate.json", {
    lavenderHits: hits.length,
    ok: hits.length === 0,
    hits,
    note: "Includes page background color/gradient + icon tiles + pale alerts",
  });
  await page.close();
}

// —— Pixel (DOM color vs parent solid bg — no glyph-center noise) ——
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ar" });
  await page.addInitScript(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
  await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);
  const routes = ["/trader", "/trader/deals", "/admin/profile", "/admin/traders"];
  // admin needs re-login
  const byRoute = {};
  let checks = 0;
  let fails = 0;

  async function scan(route) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await settle(page);
    const result = await page.evaluate(() => {
      function parse(s) {
        const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:\s*,\s*([\d.]+))?/i);
        if (!m) return null;
        const a = m[4] == null ? 1 : +m[4];
        if (a < 0.85) return null;
        return { r: +m[1], g: +m[2], b: +m[3] };
      }
      function lum({ r, g, b }) {
        const f = (c) => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      }
      function ratio(a, b) {
        return (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
      }
      function solidBg(el) {
        const self = parse(getComputedStyle(el).backgroundColor);
        if (self) return self;
        let n = el.parentElement;
        while (n && n !== document.documentElement) {
          const bg = parse(getComputedStyle(n).backgroundColor);
          if (bg) return bg;
          n = n.parentElement;
        }
        return { r: 11, g: 8, b: 13 };
      }
      const fails = [];
      let checks = 0;
      const nodes = [
        ...document.querySelectorAll(
          "h1, h2, h3, p, label, button, a, .rad-pill, .rad-btn, .rad-tx3"
        ),
      ].slice(0, 120);
      for (const el of nodes) {
        if (!(el instanceof HTMLElement)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6 || r.bottom < 0 || r.top > innerHeight) continue;
        if (el.closest(".rad-side, .rad-tabbar, nextjs-portal, .sr-only, [data-skip-link]"))
          continue;
        // Skip links are intentionally off-canvas until focused.
        if (/تخط|skip/i.test(el.textContent || "") && r.top < 0) continue;
        if (/تخط|skip/i.test(el.textContent || "") && getComputedStyle(el).position === "absolute")
          continue;
        const fg = parse(getComputedStyle(el).color);
        if (!fg) continue;
        const bg = solidBg(el);
        const rat = ratio(fg, bg);
        checks += 1;
        if (rat < 4.5) {
          fails.push({
            text: (el.innerText || "").trim().slice(0, 48),
            tag: el.tagName,
            ratio: Number(rat.toFixed(2)),
          });
        }
      }
      return { checks, fails: fails.slice(0, 12), failCount: fails.length };
    });
    byRoute[route] = result;
    checks += result.checks;
    fails += result.failCount;
  }

  for (const r of ["/trader", "/trader/deals"]) await scan(r);
  await page.context().clearCookies();
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);
  for (const r of ["/admin/profile", "/admin/traders"]) await scan(r);

  writeJson("pixel-contrast-gate.json", {
    checks,
    fails,
    ok: fails === 0,
    byRoute,
    method: "css-color-vs-nearest-opaque-parent",
  });
  await page.close();
}

// —— Axe ——
{
  const axeResults = [];
  for (const portal of [
    {
      login: "/admin/login",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      routes: ["/admin/profile", "/admin/traders", "/admin/settings"],
    },
    {
      login: "/trader/login",
      email: TRADER_EMAIL,
      password: TRADER_PASSWORD,
      routes: ["/trader", "/trader/deals", "/trader/profile"],
    },
  ]) {
    for (const locale of ["ar", "en"]) {
      for (const [w, h] of [
        [1440, 900],
        [390, 844],
      ]) {
        const context = await browser.newContext({
          viewport: { width: w, height: h },
          locale,
        });
        const page = await context.newPage();
        await login(page, portal.login, portal.email, portal.password);
        for (const route of portal.routes) {
          await page.goto(`${BASE}${route}`, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
          });
          await settle(page);
          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          axeResults.push({
            route,
            locale,
            viewport: `${w}x${h}`,
            count: results.violations.length,
            violations: results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length,
            })),
          });
        }
        await context.close();
      }
    }
  }
  const totalViolations = axeResults.reduce((n, r) => n + r.count, 0);
  writeJson("axe-gate.json", { totalViolations, results: axeResults });
}

// —— SyntaxError source ——
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const issues = [];
  page.on("pageerror", (err) =>
    issues.push({ kind: "pageerror", text: String(err), stack: err.stack?.slice(0, 400) })
  );
  page.on("console", (msg) => {
    if (msg.type() === "error")
      issues.push({ kind: "console", text: msg.text(), loc: msg.location() });
  });
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);
  for (const route of ["/admin", "/admin/profile", "/trader"]) {
    if (route.startsWith("/trader")) {
      await page.context().clearCookies();
      await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);
    }
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 90000 });
    await settle(page);
  }
  writeJson("syntax-error-gate.json", {
    ok: issues.length === 0,
    count: issues.length,
    issues: issues.slice(0, 20),
    note:
      issues.length === 0
        ? "No pageerror/console error after correct login (getByRole Sign in)."
        : "Captured with stack/location",
  });
  await page.close();
}

// —— Tabbar hidden at 1440 ——
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ar" });
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto(`${BASE}/admin/profile`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const tab = await page.evaluate(() => {
    const el = document.querySelector(".rad-tabbar");
    if (!el) return { present: false, display: null };
    return { present: true, display: getComputedStyle(el).display };
  });
  writeJson("tabbar-desktop-gate.json", {
    ok: !tab.present || tab.display === "none",
    ...tab,
  });
  await page.close();
}

await browser.close();
console.log("R7.1 gates done →", OUT);
