/**
 * Supplemental CP2 shots: traders list with rows + disable/reset confirms open.
 * Requires Next with RO_SHOW_UI_FIXTURES=1 so fixture traders are visible.
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
    const btn = page.locator(".rad-top button[aria-pressed]");
    if ((await btn.count()) > 0) await btn.first().click();
  }
  await page.waitForFunction(
    (t) =>
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") === t,
    theme,
    { timeout: 10000 }
  );
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
  await page.waitForTimeout(150);
}

async function go(page, theme, url) {
  await seedTheme(page, theme);
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 60000 });
  await setTheme(page, theme);
  await freeze(page);
  await hideNextDevIndicator(page);
}

async function shot(page, name) {
  await freeze(page);
  await hideNextDevIndicator(page);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  return name;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForSelector('input[name="email"]');
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });

const files = [];

for (const theme of ["dark", "light"]) {
  await go(page, theme, "/admin/traders");
  const rowCount = await page.locator("[data-admin-traders] tbody tr, [data-admin-traders] .rad-row").count();
  if (rowCount < 1) {
    console.error("No trader rows visible — is RO_SHOW_UI_FIXTURES=1 on the server?");
    process.exit(1);
  }
  files.push(await shot(page, `r6-traders-list-${theme}-1440-ar.png`));
}

await page.setViewportSize({ width: 390, height: 844 });
await go(page, "dark", "/admin/traders");
files.push(await shot(page, `r6-traders-list-dark-390-ar.png`));
await page.setViewportSize({ width: 1440, height: 900 });

await go(page, "dark", "/admin/traders");

async function openNativeDialog(btn) {
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await page.waitForSelector("dialog[open]", { timeout: 10000 });
  await freeze(page);
}

async function closeNativeDialog() {
  await page.evaluate(() => {
    const open = document.querySelector("dialog[open]");
    if (open instanceof HTMLDialogElement) open.close();
  });
  await page.waitForTimeout(200);
}

const createBtn = page.getByRole("button", { name: /إضافة تاجر|Add trader/i }).first();
await openNativeDialog(createBtn);
files.push(await shot(page, `r6-traders-create-open-dark-1440-ar.png`));
await closeNativeDialog();

const disableBtn = page.getByRole("button", { name: /^تعطيل$|^Disable$/i }).first();
await openNativeDialog(disableBtn);
files.push(await shot(page, `r6-traders-disable-open-dark-1440-ar.png`));
await closeNativeDialog();

const resetBtn = page
  .getByRole("button", { name: /إعادة تعيين كلمة المرور|Reset password/i })
  .first();
await openNativeDialog(resetBtn);
files.push(await shot(page, `r6-traders-reset-open-dark-1440-ar.png`));
await closeNativeDialog();

const summary = { generatedAt: new Date().toISOString(), files, fixturesVisible: true };
fs.writeFileSync(
  path.join(OUT, "r6-cp2-traders-dialogs.json"),
  JSON.stringify(summary, null, 2)
);
console.log(JSON.stringify(summary, null, 2));
await browser.close();
