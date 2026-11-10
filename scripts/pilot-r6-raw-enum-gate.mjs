/**
 * Round 6.1 — fail if admin-rendered text still shows raw SCREAMING_SNAKE enums.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6", "raw-enum-gate.json");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD" || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}

const ENUM_RE = /\b[A-Z]{3,}(_[A-Z0-9]+)+\b/g;
const ALLOW = new Set([
  "RARE_OUD",
  "CTRL_K",
  "PLAYWRIGHT_BASE_URL",
]);

const ROUTES = [
  "/admin/brokerage",
  "/admin/requests",
  "/admin/deals",
  "/admin/wholesale",
  "/admin/traders",
  "/admin/products",
  "/admin/offers",
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });

const hits = [];

for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await hideNextDevIndicator(page);
  await page.waitForFunction(
    () =>
      !document.querySelector(
        '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
      ),
    { timeout: 45000 }
  ).catch(() => {});

  // Prefer a brokerage detail when on list
  if (route === "/admin/brokerage") {
    const href = await page
      .locator('a[href^="/admin/brokerage/"]')
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (href) {
      await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(
        () =>
          !document.querySelector(
            '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
          ),
        { timeout: 45000 }
      ).catch(() => {});
    }
  }

  const text = await page.evaluate(() => {
    const root =
      document.querySelector('[data-portal="admin"] main') ||
      document.querySelector("main") ||
      document.body;
    return root?.innerText || "";
  });
  const found = [...text.matchAll(ENUM_RE)].map((m) => m[0]);
  const unique = [...new Set(found)].filter((e) => !ALLOW.has(e));
  if (unique.length) {
    hits.push({ route: page.url().replace(BASE, ""), enums: unique });
  }
}

const result = {
  ok: hits.length === 0,
  hits,
  scanned: ROUTES.length,
  at: new Date().toISOString(),
};
fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 1);
