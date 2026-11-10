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
  if (!(k in process.env) || !process.env[k]) process.env[k] = v;
}

const email = process.env.TRADER_EMAIL || "trader@rareoud.local";
const password = process.env.TRADER_PASSWORD || "ChangeMeNow!";

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
const page = await context.newPage();

await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle", timeout: 90000 });
const btnInfo = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")].map((b) => ({
    type: b.type,
    text: b.textContent?.trim(),
    disabled: b.disabled,
    pe: getComputedStyle(b).pointerEvents,
    formAction: b.form?.getAttribute("action"),
    formClass: b.form?.className,
  }));
  const form = document.querySelector("form");
  return {
    btns,
    formHTML: form?.outerHTML?.slice(0, 500),
    locked: form?.className,
  };
});
console.log(JSON.stringify(btnInfo, null, 2));

await page.locator("#email").fill(email);
await page.locator("#password").fill(password);

const reqPromise = page.waitForRequest(
  (r) => r.method() === "POST" || r.url().includes("trader"),
  { timeout: 8000 }
).then((r) => ({ method: r.method(), url: r.url() })).catch((e) => ({ err: e.message }));

await page.locator('form button[type="submit"]').click({ force: true });
console.log("request", await reqPromise);
await page.waitForTimeout(2000);
console.log("url", page.url());
await browser.close();
