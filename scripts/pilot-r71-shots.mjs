/**
 * Round 7.1 — SEND max 10 dark shots (+ light trader home) under docs/ui/pilot-r71/.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r71");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
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
  // Prefer visible content; never block forever (T1 was opacity-0, not missing DOM).
  await page
    .waitForFunction(() => {
      const main = document.querySelector(".rad-tpage, [data-trader-home], main");
      if (!main) return true;
      const text = (main.innerText || "").trim();
      return text.length > 20;
    }, { timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(300);
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

async function shot(page, name, { fullDoc = true } = {}) {
  await hideNextDevIndicator(page);
  await waitSettled(page);
  await freeze(page);
  if (fullDoc) await sizeToDocument(page);
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

const browser = await chromium.launch();
const evidence = {};

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
  evidence.login = await shot(page, "r71-trader-login-1440.png");

  await login(page, "/trader/login", TRADER_EMAIL, TRADER_PASSWORD);

  await gotoReady(page, "/trader", "dark");
  evidence.home1440 = await shot(page, "r71-trader-home-1440.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/trader", "dark");
  evidence.home390 = await shot(page, "r71-trader-home-390.png");

  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, `/trader/deals/${TRADER_DEAL}`, "dark");
  evidence.deal = await shot(page, "r71-trader-deal-detail-1440.png");

  // Reply form — scroll to composer if present
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, `/trader/deals/${TRADER_DEAL}`, "dark");
  const composer = page.locator("textarea, form").filter({ hasText: /رد|negotiat|رسال/i }).first();
  const ta = page.locator("textarea").last();
  if (await ta.count()) {
    await ta.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(200);
  }
  evidence.reply = await shot(page, "r71-trader-reply-form-390.png");

  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, `/trader/wholesale/${TRADER_WS}`, "dark");
  evidence.ws = await shot(page, "r71-trader-wholesale-detail-1440.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoReady(page, "/trader/deals/new", "dark");
  evidence.newDeal = await shot(page, "r71-trader-new-deal-390.png");

  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, "/trader", "light");
  evidence.homeLight = await shot(page, "r71-trader-light-home-1440.png");

  await context.close();
}

// —— Admin ——
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  const page = await context.newPage();
  await login(page, "/admin/login", ADMIN_EMAIL, ADMIN_PASSWORD);
  await gotoReady(page, "/admin/profile", "dark");
  evidence.profile = await shot(page, "r71-admin-profile-1440.png");
  await gotoReady(page, "/admin/traders", "dark");
  evidence.traders = await shot(page, "r71-admin-traders-1440.png");
  await context.close();
}

const manifest = {
  at: new Date().toISOString(),
  evidence,
  files: fs.readdirSync(OUT).filter((f) => f.startsWith("r71-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "r71-shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
await browser.close();
