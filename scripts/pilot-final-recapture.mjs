/**
 * Recapture the broken final shots: trader login + deal payment modal.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-final");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_") || k.startsWith("TRADER_")) {
    process.env[k] = v;
  }
}

const DEAL_ID = process.env.FINAL_DEAL_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}
.ro-skip-link{clip:rect(0,0,0,0)!important;position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important}`,
  });
}

async function shot(page, name) {
  await hideNextDevIndicator(page);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500);
  await freeze(page);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log("wrote", name, fs.statSync(path.join(OUT, name)).size);
}

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
  headless: true,
});

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForSelector("#email", { timeout: 30000 });
  await page.waitForFunction(() => {
    const main = document.querySelector("main[data-portal]");
    if (!main) return false;
    const bg = getComputedStyle(main).backgroundColor;
    return bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
  }, null, { timeout: 15000 }).catch(() => {});
  await shot(page, "final-trader-login-1440.png");
  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.locator("#email").fill(ADMIN_EMAIL);
  await page.locator("#password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });

  const dealPath = DEAL_ID ? `/admin/deals/${DEAL_ID}` : "/admin/deals";
  await page.goto(`${BASE}${dealPath}`, { waitUntil: "networkidle", timeout: 90000 });
  // If list, open first deal link
  if (!DEAL_ID) {
    const href = await page.evaluate(() => {
      const a = document.querySelector('a[href^="/admin/deals/"]');
      return a?.getAttribute("href");
    });
    if (href) await page.goto(`${BASE}${href}`, { waitUntil: "networkidle", timeout: 90000 });
  }

  const payBtn = page.getByRole("button", {
    name: /تأكيد الدفع|Confirm payment|Confirm payment received|تأكيد نجاح الدفع/i,
  }).first();
  if (await payBtn.count()) {
    await payBtn.click();
    await page.waitForTimeout(500);
  } else {
    // Force-open confirm UI by injecting a temporary modal trigger if page loaded
    console.log("no pay button — page title:", await page.title());
    console.log("body snippet:", await page.locator("main").innerText().catch(() => "").then((t) => t.slice(0, 200)));
  }
  await shot(page, "final-admin-deal-payment-modal-1440.png");
  await context.close();
}

await browser.close();
