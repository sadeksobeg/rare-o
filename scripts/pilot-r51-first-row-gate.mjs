/**
 * Round 5.1 — first tbody row must sit flush under thead (no clip/overlap).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs/ui/pilot-r51");
const OUT = path.join(OUT_DIR, "first-row-gate.json");
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
fs.mkdirSync(OUT_DIR, { recursive: true });

const LIST_ROUTES = [
  { path: "/admin/requests", key: "admin-requests" },
  { path: "/admin/customers", key: "admin-customers" },
  { path: "/admin/brokerage", key: "admin-brokerage" },
  { path: "/dev/ui-kit/requests", key: "dev-ui-kit-requests", optionalNoLogin: true },
];

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') || document.documentElement;
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
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
}

async function assessTable(page) {
  return page.evaluate(() => {
    const thead = document.querySelector(".rad-dt thead, table.rad-dt thead");
    const tbody = document.querySelector(".rad-dt tbody, table.rad-dt tbody");
    if (!thead || !tbody) {
      return { ok: false, reason: "missing thead/tbody", domRows: 0, visibleRows: 0 };
    }
    const headRect = thead.getBoundingClientRect();
    const domRows = [...tbody.querySelectorAll("tr")];
    const rows = domRows.map((tr) => {
      const r = tr.getBoundingClientRect();
      const cs = getComputedStyle(tr);
      return {
        top: r.top,
        height: r.height,
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none",
      };
    });
    const visibleRows = rows.filter((r) => r.visible);
    const first = rows[0];
    const firstOk = first
      ? first.visible && first.top >= headRect.bottom - 1 && first.height > 0
      : false;
    const allVisibleOk = rows.every((r) => !r.visible || r.height > 0);
    const countOk = domRows.length === visibleRows.length;
    return {
      ok: firstOk && allVisibleOk && countOk,
      headBottom: headRect.bottom,
      firstTop: first?.top ?? null,
      firstHeight: first?.height ?? null,
      domRows: domRows.length,
      visibleRows: visibleRows.length,
      firstOk,
      allVisibleOk,
      countOk,
    };
  });
}

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
const page = await context.newPage();

/** Dev ui-kit may work without login */
let loggedIn = false;
for (const route of LIST_ROUTES) {
  if (!route.optionalNoLogin) continue;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 15000 });
  if (!page.url().includes("/login")) break;
}

if (page.url().includes("/login")) {
  await login(page);
  loggedIn = true;
} else {
  loggedIn = false;
}

const results = [];
let failCount = 0;

for (const route of LIST_ROUTES) {
  if (route.path.startsWith("/admin") && !loggedIn) {
    await login(page);
    loggedIn = true;
  }
  for (const theme of ["dark", "light"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 60000 });
    await setTheme(page, theme);
    await hideNextDevIndicator(page);
    await page.waitForTimeout(300);
    const table = await assessTable(page);
    const row = {
      route: route.path,
      key: route.key,
      theme,
      viewport: "1440",
      ...table,
    };
    if (!row.ok) failCount += 1;
    results.push(row);
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  pass: failCount === 0,
  failCount,
  checked: results.length,
  formula: "first tbody tr.top >= thead.bottom - 1px; all visible rows height>0; dom count === visible count",
  results,
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(JSON.stringify(payload, null, 2));
await browser.close();
process.exit(failCount > 0 ? 1 : 0);
