/**
 * Round 5 — capture list + detail shots (ar, dark+light, 1440+390).
 * Hides Next.js N indicator. Also re-checks page padding-inline === 32 at 1440.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r5");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (
      !(k in process.env) ||
      !process.env[k] ||
      k.startsWith("ADMIN_") ||
      k === "DATABASE_URL"
    ) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { slug: "requests", path: "/admin/requests" },
  { slug: "deals", path: "/admin/deals" },
  { slug: "wholesale", path: "/admin/wholesale" },
  { slug: "brokerage", path: "/admin/brokerage" },
  { slug: "customers", path: "/admin/customers" },
];

const DETAIL_FINDERS = [
  { slug: "request-detail", list: "/admin/requests", link: 'a[href^="/admin/requests/"]' },
  { slug: "deal-detail", list: "/admin/deals", link: 'a[href^="/admin/deals/"]' },
  { slug: "wholesale-detail", list: "/admin/wholesale", link: 'a[href^="/admin/wholesale/"]' },
  { slug: "brokerage-detail", list: "/admin/brokerage", link: 'a[href^="/admin/brokerage/"]' },
  { slug: "customer-detail", list: "/admin/customers", link: 'a[href^="/admin/customers/"]' },
];

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') ||
      document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, theme);
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), {
    timeout: 20000,
  });
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();
await login(page);

const metrics = { paddingInline1440: null, shots: [], details: [] };

for (const theme of ["dark", "light"]) {
  for (const vp of [
    { w: 1440, h: 900, tag: "1440" },
    { w: 390, h: 844, tag: "390" },
  ]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    for (const r of ROUTES) {
      await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle" });
      await setTheme(page, theme);
      await hideNextDevIndicator(page);
      await page.waitForTimeout(350);
      if (theme === "dark" && vp.tag === "1440" && r.slug === "requests") {
        metrics.paddingInline1440 = await page.evaluate(() => {
          const el = document.querySelector("#main-content.rad-page");
          if (!el) return null;
          return Math.round(parseFloat(getComputedStyle(el).paddingLeft) || 0);
        });
      }
      const file = `r5-${r.slug}-${theme}-${vp.tag}-ar.png`;
      await page.screenshot({
        path: path.join(OUT, file),
        fullPage: false,
      });
      metrics.shots.push(file);
    }
  }
}

// Detail pages — dark+light @1440 only
await page.setViewportSize({ width: 1440, height: 900 });
for (const d of DETAIL_FINDERS) {
  await page.goto(`${BASE}${d.list}`, { waitUntil: "networkidle" });
  const href = await page.evaluate((sel) => {
    const a = [...document.querySelectorAll(sel)].find((el) => {
      const h = el.getAttribute("href") || "";
      return h.split("/").filter(Boolean).length >= 3;
    });
    return a?.getAttribute("href") || null;
  }, d.link);
  if (!href) {
    metrics.details.push({ slug: d.slug, missing: true });
    continue;
  }
  for (const theme of ["dark", "light"]) {
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
    await setTheme(page, theme);
    await hideNextDevIndicator(page);
    await page.waitForTimeout(350);
    const file = `r5-${d.slug}-${theme}-1440-ar.png`;
    await page.screenshot({
      path: path.join(OUT, file),
      fullPage: false,
    });
    metrics.details.push({ slug: d.slug, theme, file, href });
  }
}

fs.writeFileSync(
  path.join(OUT, "r5-capture-metrics.json"),
  JSON.stringify(metrics, null, 2)
);
console.log(JSON.stringify(metrics, null, 2));
await browser.close();
