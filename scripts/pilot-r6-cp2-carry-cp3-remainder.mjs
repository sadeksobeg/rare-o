/**
 * Remainder shots after traders dialogs fix + CP3 profile/security/errors.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD") process.env[k] = v;
}
fs.mkdirSync(OUT, { recursive: true });

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
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") ||
      "dark"
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForFunction(
    (t) =>
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") ===
      t,
    theme,
    { timeout: 20000 }
  );
}
async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
}
async function shot(page, name) {
  await hideNextDevIndicator(page);
  await freeze(page);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log("wrote", name);
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar", viewport: { width: 1440, height: 900 } })).newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForSelector('input[name="email"]', { timeout: 60000 });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });

await seedTheme(page, "dark");
await page.goto(`${BASE}/dev/ui-kit/traders`, { waitUntil: "domcontentloaded", timeout: 60000 });
await setTheme(page, "dark");
await page.locator('button:has-text("كلمة مرور مؤقتة")').click({ force: true });
await page.waitForTimeout(250);
await shot(page, "r6-traders-temp-password-dark-1440-ar.png");
const ack = page.locator('[data-dev-traders-dialogs] input[type="checkbox"]');
if ((await ack.count()) > 0) {
  await ack.first().check();
  await page.locator('button:has-text("إغلاق")').click();
  await page.waitForTimeout(200);
}
await page.locator('button:has-text("إنشاء تاجر")').click({ force: true });
await page.waitForTimeout(250);
await shot(page, "r6-traders-create-open-dark-1440-ar.png");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
await page.locator('button:has-text("تعطيل")').click({ force: true });
await page.waitForTimeout(250);
await shot(page, "r6-traders-disable-open-dark-1440-ar.png");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
await page.locator('button:has-text("إعادة تعيين كلمة المرور")').click({ force: true });
await page.waitForTimeout(250);
await shot(page, "r6-traders-reset-open-dark-1440-ar.png");

for (const theme of ["dark", "light"]) {
  for (const [w, h, vp] of [
    [1440, 900, "1440"],
    [390, 844, "390"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await seedTheme(page, theme);
    await page.goto(`${BASE}/admin/profile`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await setTheme(page, theme);
    await shot(page, `r6-cp3-profile-${theme}-${vp}-ar.png`);
    await seedTheme(page, theme);
    await page.goto(`${BASE}/admin/settings/security`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await setTheme(page, theme);
    await shot(page, `r6-cp3-settings-security-${theme}-${vp}-ar.png`);
  }
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/forbidden?portal=admin`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await shot(page, "r6-cp3-forbidden-dark-1440-ar.png");
await page.goto(`${BASE}/this-route-does-not-exist-r6`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await shot(page, "r6-cp3-404-dark-1440-ar.png");

fs.writeFileSync(
  path.join(OUT, "r6-cp2-carry-cp3-remainder.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), ok: true }, null, 2)
);
await browser.close();
