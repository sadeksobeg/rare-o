import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/s2a");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") process.env[k] = v;
}

const prisma = new PrismaClient();
const productCount = await prisma.product.count();
await prisma.$disconnect();
console.log("productCount", productCount);

// Cart only needs quantity for the oud-box weight; productId is display/submit.
const cart = [
  {
    productId: "s2a-fixture",
    slug: "s2a-fixture",
    name: "عود اختبار",
    price: 100,
    currency: "USD",
    quantity: 1,
    imagePath: null,
  },
];

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
await context.addInitScript((items) => {
  localStorage.setItem("ro_cart_v1", JSON.stringify(items));
  localStorage.setItem("ro-portal-theme-v5", "light");
}, cart);

const page = await context.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/request`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(800);
const sel = page.locator("select").filter({ has: page.locator('option[value="DE"]') }).first();
await sel.selectOption("DE");
await page.waitForTimeout(1500);
await hideNextDevIndicator(page);
const text = await page.evaluate(() => document.body.innerText);
const hasLabel = text.includes("الوزن المحتسب للصندوق");
const hasNeutralHelp = text.includes("تقدير وزن الشحن بحسب حجم صناديق العود");
const hasInternal =
  text.includes("مقسوم") ||
  text.includes("كيلو حجمي") ||
  text.includes("الوزن الحجمي") ||
  /حتى يُضبط|في الإدارة/.test(text);
const has130 = /\b130\b/.test(text);
const has150 = /\b150\b/.test(text);
const altOk =
  /عند التسديد هناك\s*110\s*EUR/.test(text) &&
  /عند التسديد هناك\s*130\s*EUR/.test(text);
const weightChipOk = /=\s*20\s*كغ/.test(text) || /20\s*كغ/.test(text);
const altBad = /EUR\s*أو\s*110|EUR أو 110/.test(text);
await page.screenshot({
  path: path.join(OUT, "s2a-request-de20-selector-light-1440-ar.png"),
  fullPage: false,
});
const see = {
  hasLabel,
  hasNeutralHelp,
  hasInternal,
  has130,
  has150,
  altOk,
  altBad,
  weightChipOk,
  snippet: text.replace(/\s+/g, " ").slice(0, 500),
};
fs.writeFileSync(path.join(OUT, "s2a-selector-proof.json"), JSON.stringify(see, null, 2));
console.log(JSON.stringify(see, null, 2));
await browser.close();
if (
  !hasLabel ||
  !hasNeutralHelp ||
  hasInternal ||
  !has130 ||
  !has150 ||
  !altOk ||
  altBad ||
  !weightChipOk
) {
  process.exit(1);
}
