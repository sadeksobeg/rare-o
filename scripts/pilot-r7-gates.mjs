/**
 * Round 7 gates — admin + trader routes; writes JSON under docs/ui/pilot-r7/.
 * Includes: self-test (delegates), raw-enum, first-row, modal-scrim, input-bg,
 * phone-dir, lavender sample, axe ar+en 390/1440, Next Issues probe.
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
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
  if (
    !(k in process.env) ||
    !process.env[k] ||
    k.startsWith("ADMIN_") ||
    k.startsWith("TRADER_") ||
    k === "DATABASE_URL"
  ) {
    process.env[k] = v;
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";

const ADMIN_ROUTES = [
  "/admin",
  "/admin/profile",
  "/admin/settings",
  "/admin/settings/security",
  "/admin/traders",
  "/admin/products",
  "/admin/offers",
  "/admin/brokerage",
  "/admin/deals",
  "/admin/wholesale",
  "/admin/requests",
  "/admin/team",
  "/admin/notifications",
];
const TRADER_ROUTES = [
  "/trader",
  "/trader/deals",
  "/trader/deals/new",
  "/trader/wholesale",
  "/trader/offers",
  "/trader/profile",
  "/trader/notifications",
  "/trader/brokerage",
];

const ENUM_RE = /\b[A-Z]{3,}(_[A-Z0-9]+)+\b/g;
const ALLOW = new Set(["RARE_OUD", "CTRL_K", "PLAYWRIGHT_BASE_URL"]);

function writeJson(name, data) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log("wrote", name);
  return data;
}

async function login(page, loginPath, email, password) {
  await page.goto(`${BASE}${loginPath}`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.locator("#email, input[name='email']").first().fill(email);
  await page.locator("#password, input[name='password']").first().fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), {
    timeout: 45000,
  });
}

async function settle(page) {
  await page
    .waitForFunction(
      () =>
        !document.querySelector(
          '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
        ),
      { timeout: 30000 }
    )
    .catch(() => {});
  await hideNextDevIndicator(page);
}

// —— self-test (existing script → copy) ——
{
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "scripts/pilot-r6-gate-self-test.mjs")],
    { cwd: ROOT, encoding: "utf8", env: process.env }
  );
  const src = path.join(ROOT, "docs/ui/pilot-r6/gate-self-test.json");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(OUT, "gate-self-test.json"));
  }
  console.log("self-test exit", r.status);
}

const browser = await chromium.launch();

// —— raw enum + first-row + input-bg + lavender (admin+trader) ——
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ar",
  });
  const page = await context.newPage();
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);

  const rawHits = [];
  const firstRow = [];
  const inputBgFails = [];
  const lavenderHits = [];
  const LAV = { r: 76, g: 70, b: 102 };

  function parseRgb(s) {
    const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
  }
  function dist(a, b) {
    return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
  }

  for (const route of ADMIN_ROUTES) {
    await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await settle(page);

    const text = await page.evaluate(() => document.body?.innerText || "");
    for (const m of text.matchAll(ENUM_RE)) {
      if (!ALLOW.has(m[0])) rawHits.push({ route, token: m[0] });
    }

    const fr = await page.evaluate(() => {
      const row =
        document.querySelector("table tbody tr, .rad-dt tbody tr, [data-row]") ||
        null;
      if (!row) return { route: location.pathname, ok: true, note: "no_rows" };
      const cs = getComputedStyle(row);
      const clickable = row.querySelector("a,button") || row;
      return {
        route: location.pathname,
        ok: true,
        tag: row.tagName,
        cursor: getComputedStyle(clickable).cursor,
        minHeight: cs.minHeight,
      };
    });
    firstRow.push(fr);

    const inputs = await page.evaluate((lav) => {
      const bad = [];
      const els = [
        ...document.querySelectorAll("input, textarea, select.rad-slc, .rad-inp"),
      ];
      for (const el of els) {
        if (el.type === "hidden") continue;
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) continue;
        const rgb = { r: +m[1], g: +m[2], b: +m[3] };
        const d = Math.sqrt(
          (rgb.r - lav.r) ** 2 + (rgb.g - lav.g) ** 2 + (rgb.b - lav.b) ** 2
        );
        if (d < 6) bad.push({ tag: el.tagName, bg, d });
      }
      return bad;
    }, LAV);
    if (inputs.length) inputBgFails.push({ route, inputs });

    const lav = await page.evaluate((lav) => {
      const hits = [];
      const nodes = [
        ...document.querySelectorAll(
          ".rad-sk, .ro-skeleton, [data-rad-skeleton], .rad-card, main *"
        ),
      ].slice(0, 400);
      for (const el of nodes) {
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) continue;
        const rgb = { r: +m[1], g: +m[2], b: +m[3] };
        const d = Math.sqrt(
          (rgb.r - lav.r) ** 2 + (rgb.g - lav.g) ** 2 + (rgb.b - lav.b) ** 2
        );
        if (d < 6) {
          hits.push({
            tag: el.tagName,
            cls: el.className?.toString?.().slice(0, 80),
            bg,
            d,
          });
          if (hits.length >= 8) break;
        }
      }
      return hits;
    }, LAV);
    if (lav.length) lavenderHits.push({ route, hits: lav });
  }

  // trader
  await context.clearCookies();
  await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);
  for (const route of TRADER_ROUTES) {
    await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await settle(page);
    const text = await page.evaluate(() => document.body?.innerText || "");
    for (const m of text.matchAll(ENUM_RE)) {
      if (!ALLOW.has(m[0])) rawHits.push({ route, token: m[0], portal: "trader" });
    }
  }

  writeJson("raw-enum-gate.json", {
    ok: rawHits.length === 0,
    hits: rawHits,
    checked: ADMIN_ROUTES.length + TRADER_ROUTES.length,
  });
  writeJson("first-row-gate.json", { rows: firstRow });
  writeJson("input-bg-gate.json", {
    ok: inputBgFails.length === 0,
    fails: inputBgFails,
  });
  writeJson("lavender-contrast-gate.json", {
    lavender: lavenderHits.length,
    hits: lavenderHits,
  });

  // modal scrim
  await context.clearCookies();
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto(`${BASE}/admin/deals/cmw877g90000cepg8j0xstnj9`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await settle(page);
  const payBtn = page
    .locator("button")
    .filter({ hasText: /تأكيد|دفع|payment|confirm/i })
    .first();
  let scrim = { ok: false, note: "no_button" };
  if (await payBtn.count()) {
    await payBtn.click().catch(() => {});
    await page.waitForTimeout(400);
    scrim = await page.evaluate(() => {
      const el =
        document.querySelector("[data-rad-modal-scrim]") ||
        document.querySelector(".rad-mo.rad-on");
      if (!el) return { ok: false, note: "no_scrim" };
      const r = el.getBoundingClientRect();
      return {
        ok: r.width >= window.innerWidth * 0.95 && r.height >= window.innerHeight * 0.95,
        width: r.width,
        height: r.height,
        vw: window.innerWidth,
        vh: window.innerHeight,
        parent: el.parentElement?.tagName,
      };
    });
  }
  writeJson("modal-scrim-gate.json", scrim);

  // phone-dir on traders/customers
  await page.goto(`${BASE}/admin/traders`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await settle(page);
  const phones = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("bdi[dir='ltr']")];
    return nodes.slice(0, 20).map((n) => ({
      text: (n.textContent || "").trim(),
      dir: n.getAttribute("dir"),
      style: getComputedStyle(n).unicodeBidi,
    }));
  });
  const phoneOk = phones.every(
    (p) => !/^\+?\d/.test(p.text) || (p.dir === "ltr" && p.text.startsWith("+"))
  );
  writeJson("phone-dir-gate.json", { ok: phoneOk, samples: phones.slice(0, 8) });

  await context.close();
}

// —— axe ar+en 390/1440 ——
{
  const axeResults = [];
  for (const portal of [
    {
      login: "/admin/login",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      routes: ["/admin", "/admin/profile", "/admin/settings"],
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
            violations: results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length,
            })),
            count: results.violations.length,
          });
        }
        await context.close();
      }
    }
  }
  const totalViolations = axeResults.reduce((n, r) => n + r.count, 0);
  writeJson("axe-gate.json", { totalViolations, results: axeResults });
}

// —— Next Issues 0 (console errors with nextjs) ——
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ar",
  });
  const page = await context.newPage();
  const issues = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") issues.push({ text: msg.text(), url: page.url() });
  });
  page.on("pageerror", (err) => issues.push({ text: String(err), url: page.url() }));
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);
  for (const route of ["/admin", "/admin/profile", "/admin/settings"]) {
    await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await settle(page);
  }
  await context.clearCookies();
  await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);
  for (const route of ["/trader", "/trader/deals"]) {
    await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await settle(page);
  }
  writeJson("next-issues-gate.json", {
    ok: issues.length === 0,
    count: issues.length,
    issues: issues.slice(0, 20),
  });
  await context.close();
}

await browser.close();

// keyboard pass — reuse r2 if present
{
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "scripts/pilot-r2-keyboard-nav.mjs")],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, PLAYWRIGHT_BASE_URL: BASE },
      timeout: 120000,
    }
  );
  writeJson("keyboard-gate.json", {
    exit: r.status,
    stdoutTail: (r.stdout || "").slice(-800),
    stderrTail: (r.stderr || "").slice(-400),
  });
}

console.log("R7 gates done →", OUT);
