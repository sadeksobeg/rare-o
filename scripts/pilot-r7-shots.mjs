/**
 * Round 7 — only the 15 SEND screenshots (+ payment modal) under docs/ui/pilot-r7/.
 */
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
fs.mkdirSync(OUT, { recursive: true });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";

const AWAITING_DEAL = "cmw877g90000cepg8j0xstnj9";
const BRO_ID = "cmvtkxi0z0001epm4f28vkjuz";
const TRADER_DEAL = "cmv6bzq50000vepug2i578xqz";
const TRADER_WS = "cmvcfml20000deplczv7zxcl1";

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
      document.querySelector(".ro-portal")?.getAttribute("data-theme") ||
      "dark"
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  }
  await page
    .waitForFunction(
      (t) => {
        const root =
          document.querySelector(".ro-portal[data-portal]") ||
          document.querySelector(".ro-portal");
        return root?.getAttribute("data-theme") === t;
      },
      theme,
      { timeout: 20000 }
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
      { timeout: 45000 }
    )
    .catch(() => {});
  await page.waitForTimeout(250);
}

async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
  await page.evaluate(async () => {
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

async function sizeToDocument(page) {
  const { w, h } = await page.evaluate(() => {
    const width = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    const height = Math.min(
      16000,
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight || 0
      )
    );
    return { w: width, h: Math.ceil(height) };
  });
  const cur = page.viewportSize();
  await page.setViewportSize({
    width: cur?.width || w,
    height: Math.max(h, cur?.height || 900),
  });
}

async function shot(page, name, { fullDoc = true } = {}) {
  await hideNextDevIndicator(page);
  await waitSettled(page);
  await freeze(page);
  if (fullDoc) await sizeToDocument(page);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", name);
  return name;
}

async function gotoReady(page, url, theme) {
  await seedTheme(page, theme);
  await page.goto(`${BASE}${url}`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await setTheme(page, theme);
  await waitSettled(page);
}

async function login(page, pathLogin, email, password) {
  await page.goto(`${BASE}${pathLogin}`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.locator("#email, input[name='email']").first().fill(email);
  await page.locator("#password, input[name='password']").first().fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  try {
    await page.waitForURL((u) => !u.pathname.includes("/login"), {
      timeout: 45000,
    });
  } catch (err) {
    const alert = await page
      .locator('[role="alert"], .rad-ferr, .ro-banner')
      .first()
      .textContent()
      .catch(() => null);
    throw new Error(
      `Login failed on ${pathLogin} as ${email}: ${alert || err.message}`
    );
  }
}

const browser = await chromium.launch();
const evidence = {};

// —— Admin context ——
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();

  await seedTheme(page, "dark");
  await page.goto(`${BASE}/admin/login`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  evidence.r7_login = await shot(page, "r7-login.png", { fullDoc: true });
  await page.setViewportSize({ width: 390, height: 844 });
  evidence.r7_login_390 = await shot(page, "r7-login-390.png", { fullDoc: true });
  await page.setViewportSize({ width: 1440, height: 900 });

  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);

  await gotoReady(page, "/admin/profile", "dark");
  evidence.r7_profile = await shot(page, "r7-profile.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/admin/profile", "dark");
  evidence.r7_profile_390 = await shot(page, "r7-profile-390.png");
  await page.setViewportSize({ width: 1440, height: 900 });

  await gotoReady(page, "/admin/settings/security", "dark");
  evidence.r7_security = await shot(page, "r7-security.png");

  await gotoReady(page, "/admin/settings", "dark");
  evidence.r7_settings = await shot(page, "r7-settings.png");

  await gotoReady(page, `/admin/brokerage/${BRO_ID}`, "dark");
  evidence.r7_brokerage_detail = await shot(page, "r7-brokerage-detail.png");

  await gotoReady(page, "/admin/traders", "dark");
  const createBtn = page
    .getByRole("button", { name: /تاجر|إنشاء|إضافة|Create|Add/i })
    .first();
  if (await createBtn.count()) {
    await createBtn.click().catch(() => {});
    await page.waitForTimeout(400);
    evidence.r7_traders_create_dialog = await shot(
      page,
      "r7-traders-create-dialog.png",
      { fullDoc: false }
    );
    await page.keyboard.press("Escape").catch(() => {});
  }

  await page.goto(`${BASE}/forbidden?portal=admin`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await setTheme(page, "dark");
  evidence.r7_forbidden = await shot(page, "r7-forbidden.png");

  // Payment confirm modal
  await gotoReady(page, `/admin/deals/${AWAITING_DEAL}`, "dark");
  const payBtn = page
    .locator("button.rad-btn.rad-pri, button")
    .filter({ hasText: /تأكيد|دفع|payment|confirm/i })
    .first();
  if (await payBtn.count()) {
    await payBtn.click().catch(() => {});
    await page.waitForTimeout(400);
    const modal = page.locator("[data-rad-modal-scrim], .rad-mo.rad-on, [role=dialog]");
    await modal.first().waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    evidence.r7_payment_confirm_modal = await shot(
      page,
      "r7-payment-confirm-modal.png",
      { fullDoc: false }
    );
  } else {
    console.warn("payment confirm button not found");
  }

  await context.close();
}

// —— Trader context ——
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();
  await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);

  await gotoReady(page, "/trader", "dark");
  evidence.r7_trader_home = await shot(page, "r7-trader-home.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/trader", "dark");
  evidence.r7_trader_home_390 = await shot(page, "r7-trader-home-390.png");

  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, `/trader/deals/${TRADER_DEAL}`, "dark");
  evidence.r7_trader_deal_detail = await shot(page, "r7-trader-deal-detail.png");

  await gotoReady(page, `/trader/wholesale/${TRADER_WS}`, "dark");
  evidence.r7_trader_wholesale_detail = await shot(
    page,
    "r7-trader-wholesale-detail.png"
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/trader/deals/new", "dark");
  evidence.r7_trader_new_deal_390 = await shot(page, "r7-trader-new-deal-390.png");

  await context.close();
}

const manifest = {
  at: new Date().toISOString(),
  evidence,
  files: fs.readdirSync(OUT).filter((f) => f.startsWith("r7-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "r7-shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
await browser.close();
