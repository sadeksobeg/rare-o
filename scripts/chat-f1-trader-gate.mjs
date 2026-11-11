/**
 * CHAT-F1 trader portal gate — 390 composer above tab bar, plum bubble contrast,
 * no console errors. Local only with simulated worker / seeded trader.
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… TRADER_PASSWORD=… node scripts/chat-f1-trader-gate.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/chat/shots");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}
loadDotEnv();

const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function relLuminance(r, g, b) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const L1 = relLuminance(...a);
  const L2 = relLuminance(...b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgb(s) {
  const m = String(s).match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 20000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 8 });
}

async function loginTrader(page) {
  await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', TRADER_EMAIL);
  await setVal(page, 'input[name="password"]', TRADER_PASSWORD);
  await Promise.all([
    page.waitForURL(
      (u) => u.pathname.startsWith("/trader") && !u.pathname.includes("/login"),
      { timeout: 30000 }
    ),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), {
    timeout: 30000,
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await loginTrader(page);
  await page.goto(`${BASE}/trader/messages`, { waitUntil: "domcontentloaded" });
  await page.locator(".rad-tmsg, textarea").first().waitFor({ timeout: 20000 });
  // Let CSS HMR / fonts settle before geometry gates.
  await page.waitForTimeout(1200);
  await page.locator(".rad-tmsg-scroll").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  }).catch(() => {});
  await page.waitForTimeout(200);

  const composer = page.locator(".rad-tmsg-composer").first();
  await composer.waitFor({ state: "visible", timeout: 15000 });
  const box = await composer.boundingBox();
  const tab = page.locator(".rad-tabbar").first();
  const tabBox = (await tab.isVisible().catch(() => false))
    ? await tab.boundingBox()
    : null;
  if (!box) throw new Error("composer has no box");
  // Allow 1px subpixel; require composer fully above tab top.
  if (tabBox && box.y + box.height > tabBox.y + 1) {
    throw new Error(
      `composer overlaps tab bar (composer.bottom=${box.y + box.height}, tab.top=${tabBox.y})`
    );
  }
  const pos = await composer.evaluate((el) => getComputedStyle(el).position);
  if (pos === "fixed" || pos === "sticky") {
    throw new Error(`composer must be normal-flow footer, got position=${pos}`);
  }
  const strip = await page.evaluate(() => {
    const composer = document.querySelector(".rad-tmsg-composer");
    const tab = document.querySelector(".rad-tabbar");
    if (!composer || !tab) return { ok: false, reason: "missing composer/tab" };
    const c = composer.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const y = c.bottom + Math.max(2, (t.top - c.bottom) / 2);
    const xs = [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => window.innerWidth * f);
    const bad = [];
    for (const x of xs) {
      const hit = document.elementsFromPoint(x, y).find((el) => {
        if (!(el instanceof Element)) return false;
        if (el.closest(".rad-tmsg-composer, .rad-tabbar")) return false;
        return Boolean(el.closest(".rad-tmsg-scroll article, .rad-tmsg-scroll .group"));
      });
      if (hit) bad.push(hit.tagName);
    }
    return { ok: bad.length === 0, bad, y: Math.round(y) };
  });
  if (!strip.ok) {
    throw new Error(`messages in composer↔tab strip: ${JSON.stringify(strip)}`);
  }
  await page.screenshot({
    path: path.join(OUT, "f1-trader-390-composer.png"),
    fullPage: false,
  });
  console.log(
    "SHOT f1-trader-390-composer.png: composer visible above tab rail at 390"
  );

  // Contrast: own bubble text vs bg
  const mine = page.locator('article[class*="ms-auto"], .group.ms-auto').first();
  if (await mine.count()) {
    const colors = await mine.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundColor };
    });
    const fg = parseRgb(colors.color);
    const bg = parseRgb(colors.bg);
    if (fg && bg) {
      const ratio = contrast(fg, bg);
      console.log(`contrast mine-bubble=${ratio.toFixed(2)}:1`);
      if (ratio < 4.5) {
        throw new Error(`own bubble contrast ${ratio.toFixed(2)} < 4.5`);
      }
    }
  }

  // Theme dark if toggle exists
  await page.evaluate(() => {
    const root =
      document.querySelector('[data-portal="trader"]') || document.documentElement;
    root.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(200);
  if (await mine.count()) {
    const colors = await mine.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundColor };
    });
    const fg = parseRgb(colors.color);
    const bg = parseRgb(colors.bg);
    if (fg && bg) {
      const ratio = contrast(fg, bg);
      console.log(`contrast mine-bubble-dark=${ratio.toFixed(2)}:1`);
      if (ratio < 4.5) {
        throw new Error(`dark own bubble contrast ${ratio.toFixed(2)} < 4.5`);
      }
    }
  }
  await page.screenshot({
    path: path.join(OUT, "f1-trader-390-dark.png"),
    fullPage: false,
  });
  console.log("SHOT f1-trader-390-dark.png: dark theme messages at 390");

  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const adminPage = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await loginAdmin(adminPage);
    await adminPage.goto(`${BASE}/admin/inbox`, {
      waitUntil: "domcontentloaded",
    });
    const row = adminPage.locator("a.rad-cv").first();
    if (await row.count()) {
      await row.click();
      await adminPage.waitForURL(/\/admin\/inbox\/[^/]+/, { timeout: 20000 });
      await adminPage.locator(".rad-chchip, .rad-cmp").first().waitFor({
        timeout: 15000,
      });
      await adminPage.screenshot({
        path: path.join(OUT, "f1-admin-channel-chips.png"),
        fullPage: false,
      });
      console.log(
        "SHOT f1-admin-channel-chips.png: thread with channel chips / composer channel"
      );
    }
    await adminPage.close();
  }

  const serious = errors.filter(
    (e) =>
      !/favicon|ResizeObserver|hydration|net::ERR/i.test(e) &&
      !/Failed to load resource/i.test(e)
  );
  if (serious.length) {
    console.error(serious);
    throw new Error(`console errors: ${serious.length}`);
  }

  await browser.close();
  console.log("chat-f1-trader-gate: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
