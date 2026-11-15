/**
 * Checkpoint 2 visual evidence — frozen theme, full owner shot list.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
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
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD" || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}
fs.mkdirSync(OUT, { recursive: true });

function prismaFirst(model) {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    return JSON.parse(raw.trim().split(/\r?\n/).pop())?.id ?? null;
  } catch {
    return null;
  }
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

async function shot(page, name, fullPage = true) {
  await freeze(page);
  await hideNextDevIndicator(page);
  await page.screenshot({ path: path.join(OUT, name), fullPage });
  return name;
}

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error("Missing ADMIN_EMAIL / ADMIN_PASSWORD from .env");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForSelector('input[name="email"]', { timeout: 30000 });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });

const files = [];
const productId = prismaFirst("product");
const offerId = prismaFirst("publicCuratedOffer");
const broId = prismaFirst("brokerageRequest");
const dealId = prismaFirst("dealProposal");

// ——— Traders ———
for (const theme of ["dark", "light"]) {
  await go(page, theme, "/admin/traders");
  files.push(await shot(page, `r6-traders-list-${theme}-1440-ar.png`, false));
}
await page.setViewportSize({ width: 390, height: 844 });
await go(page, "dark", "/admin/traders");
files.push(await shot(page, `r6-traders-list-dark-390-ar.png`, false));
await page.setViewportSize({ width: 1440, height: 900 });

await go(page, "dark", "/admin/traders");

async function openNativeDialog(btn) {
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

// Create trader drawer/dialog
const createBtn = page.getByRole("button", { name: /إضافة تاجر|Add trader/i }).first();
if ((await createBtn.count()) > 0) {
  await openNativeDialog(createBtn);
  files.push(await shot(page, `r6-traders-create-open-dark-1440-ar.png`, false));
  await closeNativeDialog();
}

// Disable confirm on first row (do NOT confirm — capture open state only)
const disableBtn = page.getByRole("button", { name: /^تعطيل$|^Disable$/i }).first();
if ((await disableBtn.count()) > 0) {
  await openNativeDialog(disableBtn);
  files.push(await shot(page, `r6-traders-disable-open-dark-1440-ar.png`, false));
  await closeNativeDialog();
}

// Reset-password confirm (capture confirm dialog — do not submit reset)
const resetBtn = page
  .getByRole("button", { name: /إعادة تعيين كلمة المرور|Reset password/i })
  .first();
if ((await resetBtn.count()) > 0) {
  await openNativeDialog(resetBtn);
  files.push(await shot(page, `r6-traders-reset-open-dark-1440-ar.png`, false));
  await closeNativeDialog();
}

// ——— Offers ———
for (const theme of ["dark", "light"]) {
  await go(page, theme, "/admin/offers");
  files.push(await shot(page, `r6-offers-list-${theme}-1440-ar.png`, false));
  await go(page, theme, "/admin/offers/new");
  files.push(await shot(page, `r6-offers-new-${theme}-1440-ar.png`, true));
  if (offerId) {
    await go(page, theme, `/admin/offers/${offerId}`);
    files.push(await shot(page, `r6-offers-detail-${theme}-1440-ar.png`, true));
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await go(page, "dark", "/admin/offers/new");
files.push(await shot(page, `r6-offers-new-dark-390-ar.png`, true));
if (offerId) {
  await go(page, "dark", `/admin/offers/${offerId}`);
  files.push(await shot(page, `r6-offers-detail-dark-390-ar.png`, true));
}
await page.setViewportSize({ width: 1440, height: 900 });

// ——— Product editor (full page + media) ———
if (productId) {
  for (const theme of ["dark", "light"]) {
    await go(page, theme, `/admin/products/${productId}`);
    files.push(await shot(page, `r6-product-editor-${theme}-1440-ar.png`, true));
    await page.evaluate(() => {
      document.querySelector("#sec-media")?.scrollIntoView({ block: "start" });
    });
    await freeze(page);
    files.push(await shot(page, `r6-product-editor-media-${theme}-1440-ar.png`, false));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["dark", "light"]) {
    await go(page, theme, `/admin/products/${productId}`);
    files.push(await shot(page, `r6-product-editor-${theme}-390-ar.png`, true));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}
for (const theme of ["dark", "light"]) {
  await go(page, theme, "/admin/products/new");
  files.push(await shot(page, `r6-product-new-${theme}-1440-ar.png`, true));
}

// ——— Products list + categories ———
for (const theme of ["dark", "light"]) {
  await go(page, theme, "/admin/products");
  files.push(await shot(page, `r6-products-list-${theme}-1440-ar.png`, false));
  await go(page, theme, "/admin/categories");
  files.push(await shot(page, `r6-categories-${theme}-1440-ar.png`, false));
}
await page.setViewportSize({ width: 390, height: 844 });
for (const theme of ["dark", "light"]) {
  await go(page, theme, "/admin/products");
  files.push(await shot(page, `r6-products-list-${theme}-390-ar.png`, false));
}
await page.setViewportSize({ width: 1440, height: 900 });

// ——— Brokerage + deal negotiation ———
await go(page, "dark", "/admin/brokerage?view=kanban");
files.push(await shot(page, `r6-brokerage-kanban-dark-1440-ar.png`, false));
if (broId) {
  await go(page, "dark", `/admin/brokerage/${broId}`);
  files.push(await shot(page, `r6-brokerage-detail-dark-1440-ar.png`, true));
}
if (dealId) {
  await go(page, "dark", `/admin/deals/${dealId}`);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("h2,h3,.rad-ch,section")].find((n) =>
      /سجل التفاوض|Negotiation/i.test(n.textContent || "")
    );
    el?.scrollIntoView({ block: "start" });
  });
  await freeze(page);
  files.push(await shot(page, `r6-deal-negotiation-dark-1440-ar.png`, true));
}

const summary = {
  generatedAt: new Date().toISOString(),
  files,
  ids: { productId, offerId, broId, dealId },
};
fs.writeFileSync(path.join(OUT, "r6-cp2-visual-evidence.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
await browser.close();
