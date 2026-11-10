import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("TRADER_")) process.env[k] = v;
}

const browser = await chromium.launch();
const page = await (
  await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ar" })
).newPage();
await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle" });
await page.locator("#email").fill(process.env.TRADER_EMAIL || "trader@rareoud.local");
await page.locator("#password").fill(process.env.TRADER_PASSWORD || "ChangeMeNow!");
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto(`${BASE}/trader/deals/new`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const ul = document.querySelector(".ro-picker-grid");
  if (!ul) return { missing: true };
  const cs = getComputedStyle(ul);
  const items = [...ul.children].slice(0, 4).map((li) => {
    const r = li.getBoundingClientRect();
    return { left: r.left, right: r.right, width: r.width };
  });
  return {
    vw: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    ulWidth: ul.getBoundingClientRect().width,
    columns: cs.gridTemplateColumns,
    overflowX: cs.overflowX,
    items,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
