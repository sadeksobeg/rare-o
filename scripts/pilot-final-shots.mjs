/**
 * FINAL — exactly 12 screenshots under docs/ui/pilot-final/.
 * Dark unless noted. Against PLAYWRIGHT_BASE_URL (prod or dev).
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

async function seedTheme(page, theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  const current = await page.evaluate(
    () =>
      document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") ||
      "dark"
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  }
  await page
    .waitForFunction(
      (t) =>
        document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") === t,
      theme,
      { timeout: 15000 }
    )
    .catch(() => {});
}

async function waitSettled(page) {
  await page
    .waitForFunction(
      () =>
        !document.querySelector(
          '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
        ),
      { timeout: 20000 }
    )
    .catch(() => {});
  await page.waitForTimeout(350);
}

async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
}

async function sizeToDocument(page) {
  const h = await page.evaluate(() =>
    Math.min(
      16000,
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight || 0
      )
    )
  );
  const cur = page.viewportSize();
  await page.setViewportSize({
    width: cur?.width || 1440,
    height: Math.max(Math.ceil(h), cur?.height || 900),
  });
}

async function shot(page, name) {
  await hideNextDevIndicator(page);
  await waitSettled(page);
  await freeze(page);
  await sizeToDocument(page);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log("wrote", name);
  return name;
}

async function login(page, pathLogin, email, password) {
  await page.goto(`${BASE}${pathLogin}`, { waitUntil: "networkidle", timeout: 90000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
}

async function gotoReady(page, url, theme) {
  await seedTheme(page, theme);
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await setTheme(page, theme);
  await waitSettled(page);
}

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PW_CHANNEL || "chrome",
});
const evidence = {};

// —— Admin ——
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);

  await gotoReady(page, "/admin", "dark");
  evidence.adminDashboard = await shot(page, "final-admin-dashboard-1440.png");

  await gotoReady(page, "/admin/inbox", "dark");
  evidence.adminInbox = await shot(page, "final-admin-inbox-1440.png");

  await gotoReady(page, "/admin/requests", "light");
  evidence.adminRequestsLight = await shot(page, "final-admin-requests-1440-light.png");

  // Deals detail + payment modal (prefer awaiting_payment id)
  const dealId = process.env.FINAL_DEAL_ID || "cmw877g90000cepg8j0xstnj9";
  await gotoReady(page, `/admin/deals/${dealId}`, "dark");
  const payBtn = page
    .getByRole("button", { name: /تأكيد نجاح الدفع|تأكيد الدفع|Confirm payment/i })
    .first();
  if (await payBtn.count()) {
    await payBtn.click().catch(() => {});
    await page.waitForTimeout(500);
  }
  evidence.adminDealPay = await shot(page, "final-admin-deal-payment-modal-1440.png");

  await gotoReady(page, "/admin/products", "dark");
  const prodHref =
    (await page.evaluate(() => {
      const a = document.querySelector('a[href^="/admin/products/"]');
      return a?.getAttribute("href") || null;
    })) || "/admin/products/new";
  await gotoReady(page, prodHref, "dark");
  evidence.adminProduct = await shot(page, "final-admin-product-editor-1440.png");

  await gotoReady(page, "/admin/brokerage", "dark");
  evidence.adminBrokerage = await shot(page, "final-admin-brokerage-kanban-1440.png");

  await context.close();
}

// —— Trader ——
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();

  await seedTheme(page, "dark");
  await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle", timeout: 90000 });
  evidence.traderLogin = await shot(page, "final-trader-login-1440.png");

  await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/trader", "dark");
  evidence.traderHome390 = await shot(page, "final-trader-home-390.png");

  await gotoReady(page, "/trader/deals/new", "dark");
  evidence.traderNewDeal = await shot(page, "final-trader-new-deal-390.png");

  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, "/trader/deals", "dark");
  const tDeal =
    (await page.evaluate(() => {
      const a = document.querySelector('a[href^="/trader/deals/"]');
      return a?.getAttribute("href") || null;
    })) || "/trader/deals";
  await gotoReady(page, tDeal, "dark");
  evidence.traderDeal = await shot(page, "final-trader-deal-detail-1440.png");

  // Wholesale "new" = request form surface
  await gotoReady(page, "/trader/wholesale", "dark");
  const wsNew = page.getByRole("link", { name: /طلب|جديد|New|Request/i }).first();
  if (await wsNew.count()) {
    await wsNew.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  evidence.traderWs = await shot(page, "final-trader-wholesale-new-1440.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/trader/notifications", "dark");
  evidence.traderNotif = await shot(page, "final-trader-notifications-390.png");

  await context.close();
}

const manifest = {
  at: new Date().toISOString(),
  base: BASE,
  evidence,
  files: fs.readdirSync(OUT).filter((f) => f.startsWith("final-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
await browser.close();
