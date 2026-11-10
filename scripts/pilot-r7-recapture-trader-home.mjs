import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r7");
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
  await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ar" })
).newPage();
await page.addInitScript(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle" });
await page.locator("#email").fill(process.env.TRADER_EMAIL || "trader@rareoud.local");
await page.locator("#password").fill(process.env.TRADER_PASSWORD || "ChangeMeNow!");
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto(`${BASE}/trader`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => !document.querySelector('[aria-busy="true"], .rad-sk')).catch(() => {});
await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important}` });
await hideNextDevIndicator(page);
const h = await page.evaluate(() =>
  Math.min(16000, Math.max(document.documentElement.scrollHeight, innerHeight))
);
await page.setViewportSize({ width: 1440, height: Math.max(h, 900) });
await page.screenshot({ path: path.join(OUT, "r7-trader-home.png"), fullPage: false });
console.log("rewrote r7-trader-home.png");
await browser.close();
