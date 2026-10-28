/**
 * V2 screenshots: AR/EN × 390/768/1440 for admin dashboard, trader home,
 * an empty state, and /dev/ui icon gallery.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import { href } from "../lib/href";
import type { Locale } from "../lib/i18n/config";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/visual/v2/screenshots");
const BASE = (process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

const VIEWPORTS = [
  { tag: "390", width: 390, height: 844 },
  { tag: "768", width: 768, height: 1024 },
  { tag: "1440", width: 1440, height: 900 },
] as const;

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

async function shot(page: Page, file: string, locator?: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (locator) {
    const el = page.locator(locator).first();
    await el.waitFor({ state: "visible", timeout: 20_000 });
    await el.evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(250);
    await page.screenshot({ path: file });
    return;
  }
  await page.screenshot({ path: file, fullPage: true });
}

async function openLang(browser: Awaited<ReturnType<typeof chromium.launch>>, lang: Locale) {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addCookies([{ name: "ro_locale", value: lang, url: BASE }]);
  const page = await context.newPage();
  return { context, page };
}

async function settlePortal(page: Page) {
  await page
    .locator('[aria-busy="true"]')
    .first()
    .waitFor({ state: "detached", timeout: 20_000 })
    .catch(() => null);
  await page
    .locator(".ro-portal-kpi, .ro-portal-section-title, [data-variant]")
    .first()
    .waitFor({ timeout: 20_000 })
    .catch(() => null);
  await page.waitForTimeout(400);
}

async function login(
  page: Page,
  loginPath: string,
  email: string,
  password: string,
  lang: string
) {
  await page.goto(`${BASE}${loginPath}?lang=${lang}`, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in|دخول|تسجيل/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), {
    timeout: 30_000,
  });
}

async function main() {
  loadEnv();
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || "chrome",
  });
  const files: string[] = [];
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@rareoud.local";
  const adminPass = process.env.ADMIN_PASSWORD ?? "ChangeMeNow!";
  const traderEmail = process.env.TRADER_EMAIL ?? "trader@rareoud.local";
  const traderPass = process.env.TRADER_PASSWORD ?? "ChangeMeNow!";

  for (const lang of ["ar", "en"] as const) {
    const { context, page } = await openLang(browser, lang);
    await login(page, "/admin/login", adminEmail, adminPass, lang);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/admin`, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      await page.locator("h1").first().waitFor({ timeout: 20_000 }).catch(() => null);
      await settlePortal(page);
      const file = path.join(OUT, `admin-dashboard-${lang}-${vp.tag}.png`);
      await shot(page, file);
      files.push(path.relative(ROOT, file));
      console.log("wrote", path.relative(ROOT, file));
    }
    await context.close();
  }

  for (const lang of ["ar", "en"] as const) {
    const { context, page } = await openLang(browser, lang);
    await login(page, "/trader/login", traderEmail, traderPass, lang);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/trader`, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      await page.locator("h1").first().waitFor({ timeout: 20_000 }).catch(() => null);
      await settlePortal(page);
      const file = path.join(OUT, `trader-home-${lang}-${vp.tag}.png`);
      await shot(page, file);
      files.push(path.relative(ROOT, file));
      console.log("wrote", path.relative(ROOT, file));
    }
    await context.close();
  }

  for (const lang of ["ar", "en"] as const) {
    const { context, page } = await openLang(browser, lang);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const url = `${BASE}${href("/catalog", lang)}?q=__empty_v2__`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page
        .locator("[data-variant]")
        .first()
        .waitFor({ timeout: 20_000 })
        .catch(() => null);
      const file = path.join(OUT, `empty-state-${lang}-${vp.tag}.png`);
      await shot(page, file);
      files.push(path.relative(ROOT, file));
      console.log("wrote", path.relative(ROOT, file));
    }
    await context.close();
  }

  for (const lang of ["ar", "en"] as const) {
    const { context, page } = await openLang(browser, lang);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}${href("/dev/ui", lang)}?lang=${lang}#icons`, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      await page.locator("#icons").waitFor({ timeout: 20_000 }).catch(() => null);
      const file = path.join(OUT, `dev-ui-icons-${lang}-${vp.tag}.png`);
      await shot(page, file, "#icons");
      files.push(path.relative(ROOT, file));
      console.log("wrote", path.relative(ROOT, file));
    }
    await context.close();
  }

  await browser.close();
  const manifest = {
    at: new Date().toISOString(),
    base: BASE,
    files,
  };
  fs.writeFileSync(
    path.join(OUT, "..", "screenshots.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log("wrote", files.length, "screenshots");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
