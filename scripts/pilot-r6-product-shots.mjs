/**
 * Round 6 — product editor + refreshed brokerage detail shots.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

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
fs.mkdirSync(OUT, { recursive: true });

function prismaFirst(model) {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    return JSON.parse(raw.trim().split(/\r?\n/).pop())?.id ?? null;
  } catch {
    return null;
  }
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  const current = await page.evaluate(() => {
    const root = document.querySelector('[data-portal="admin"]');
    return root?.getAttribute("data-theme") || "dark";
  });
  if (current !== theme) {
    const themeBtn = page.locator(".rad-top button[aria-pressed]");
    if ((await themeBtn.count()) > 0) await themeBtn.first().click();
  }
  await page.waitForFunction(
    (t) =>
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") === t,
    theme,
    { timeout: 10000 }
  );
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const productId = prismaFirst("product");
const files = [];
if (productId) {
  await page.goto(`${BASE}/admin/products/${productId}`, { waitUntil: "networkidle" });
  await setTheme(page, "dark");
  await hideNextDevIndicator(page);
  let f = "r6-product-editor-dark-1440-ar.png";
  await page.screenshot({ path: path.join(OUT, f), fullPage: false });
  files.push(f);
  await setTheme(page, "light");
  f = "r6-product-editor-light-1440-ar.png";
  await page.screenshot({ path: path.join(OUT, f), fullPage: false });
  files.push(f);
}

await page.goto(`${BASE}/admin/products/new`, { waitUntil: "networkidle" });
await setTheme(page, "dark");
await hideNextDevIndicator(page);
{
  const f = "r6-product-new-dark-1440-ar.png";
  await page.screenshot({ path: path.join(OUT, f), fullPage: false });
  files.push(f);
}

const broId = prismaFirst("brokerageRequest");
if (broId) {
  await page.goto(`${BASE}/admin/brokerage/${broId}`, { waitUntil: "networkidle" });
  await setTheme(page, "dark");
  await hideNextDevIndicator(page);
  const f = "r6-brokerage-detail-dark-1440-ar.png";
  await page.screenshot({ path: path.join(OUT, f), fullPage: false });
  files.push(f);
}

fs.writeFileSync(
  path.join(OUT, "r6-product-shots.json"),
  JSON.stringify({ productId, broId, files }, null, 2)
);
console.log(JSON.stringify({ productId, broId, files }, null, 2));
await browser.close();
