/**
 * V1 visual baseline: AR/EN × 390/768/1440 for key routes.
 * Writes docs/visual/baseline/screenshots/ and a manifest JSON.
 * Does not reseed. Expects the app at PLAYWRIGHT_BASE_URL (default :3000).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";
import { href } from "../lib/href";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/visual/baseline/screenshots");
const BASE = (process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

const VIEWPORTS = [
  { tag: "390", width: 390, height: 844 },
  { tag: "768", width: 768, height: 1024 },
  { tag: "1440", width: 1440, height: 900 },
] as const;

const STOREFRONT = [
  { name: "home", path: "/" },
  { name: "catalog", path: "/catalog" },
  { name: "product", path: "/product/oud-vip-signature" },
  { name: "request", path: "/request" },
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

async function shot(page: Page, file: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: true });
}

async function main() {
  loadEnv();
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || "chrome",
  });
  const files: string[] = [];

  for (const lang of ["ar", "en"] as const) {
    const context = await browser.newContext();
    await context.addCookies([
      { name: "ro_locale", value: lang, url: BASE },
    ]);
    const page = await context.newPage();

    for (const route of STOREFRONT) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const url = `${BASE}${href(route.path, lang)}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.locator("h1").first().waitFor({ timeout: 20_000 }).catch(() => null);
        const file = path.join(OUT, `${route.name}-${lang}-${vp.tag}.png`);
        await shot(page, file);
        files.push(path.relative(ROOT, file));
        console.log("wrote", path.relative(ROOT, file));
      }
    }
    await context.close();
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@rareoud.local";
  const adminPass = process.env.ADMIN_PASSWORD ?? "ChangeMeNow!";
  const traderEmail = process.env.TRADER_EMAIL ?? "trader@rareoud.local";
  const traderPass = process.env.TRADER_PASSWORD ?? "ChangeMeNow!";

  async function capturePortal(
    name: "admin" | "trader",
    loginPath: string,
    homePath: string,
    email: string,
    password: string
  ) {
    for (const lang of ["ar", "en"] as const) {
      const context = await browser.newContext();
      await context.addCookies([
        { name: "ro_locale", value: lang, url: BASE },
      ]);
      const page = await context.newPage();
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
      if (page.url().includes("/login") === false && !page.url().includes(homePath)) {
        await page.goto(`${BASE}${homePath}`, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
      }
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`${BASE}${homePath}`, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        await page.locator("h1").first().waitFor({ timeout: 20_000 }).catch(() => null);
        const file = path.join(OUT, `${name}-home-${lang}-${vp.tag}.png`);
        await shot(page, file);
        files.push(path.relative(ROOT, file));
        console.log("wrote", path.relative(ROOT, file));
      }
      await context.close();
    }
  }

  await capturePortal("admin", "/admin/login", "/admin", adminEmail, adminPass);
  await capturePortal("trader", "/trader/login", "/trader", traderEmail, traderPass);

  await browser.close();

  const manifest = {
    at: new Date().toISOString(),
    base: BASE,
    files,
  };
  fs.writeFileSync(
    path.join(ROOT, "docs/visual/baseline/screenshots.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log("v1-baseline-capture: %d files", files.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
