/**
 * Round 6.1 evidence — one filename per fixed item.
 * Waits until skeletons/`aria-busy` are gone; full pages size viewport to document height.
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
const MANIFEST = path.join(OUT, "r6.1-evidence.json");

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
      document.querySelector(".ro-portal")?.getAttribute("data-theme") ||
      "dark"
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForFunction(
    (t) => {
      const root =
        document.querySelector('[data-portal="admin"]') ||
        document.querySelector(".ro-portal");
      if (!root) return false;
      return root.getAttribute("data-theme") === t;
    },
    theme,
    { timeout: 20000 }
  );
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
  await page.waitForTimeout(200);
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

/** Size viewport to document height so sidebar paints full length (no 900px cut). */
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
  await page.setViewportSize({ width: cur?.width || w, height: Math.max(h, cur?.height || 900) });
}

async function shot(page, name, { fullDoc = false } = {}) {
  await hideNextDevIndicator(page);
  await waitSettled(page);
  await freeze(page);
  if (fullDoc) await sizeToDocument(page);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", name);
  return name;
}

const productId = prismaFirst("product");
const offerId = prismaFirst("publicCuratedOffer");
const broId = prismaFirst("brokerageRequest");

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "ar",
});
const page = await context.newPage();
const evidence = {};
const skeletonOnlyRoutes = [];

async function gotoReady(url, theme) {
  await seedTheme(page, theme);
  await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await setTheme(page, theme);
  const hadSkeleton = await page.evaluate(() =>
    Boolean(
      document.querySelector(
        '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
      )
    )
  );
  await waitSettled(page);
  const stillSkeleton = await page.evaluate(() =>
    Boolean(
      document.querySelector(
        '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
      )
    )
  );
  if (stillSkeleton) {
    skeletonOnlyRoutes.push({ url, theme, note: "stuck_or_slow_skeleton" });
  } else if (hadSkeleton) {
    /* finished loading after skeleton — expected */
  }
}

// —— Login real route ——
await seedTheme(page, "dark");
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
evidence.loginDark1440 = await shot(page, "r61-login-dark-1440-ar.png", { fullDoc: true });
await page.setViewportSize({ width: 390, height: 844 });
evidence.loginDark390 = await shot(page, "r61-login-dark-390-ar.png", { fullDoc: true });
await page.setViewportSize({ width: 1440, height: 900 });

for (const st of ["error", "lock", "2fa", "recovery"]) {
  await page.goto(`${BASE}/dev/auth-states?state=${st}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  evidence[`auth_${st}`] = await shot(page, `r61-auth-${st}-dark-1440-ar.png`, {
    fullDoc: true,
  });
}

// —— Auth ——
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });

async function capture(url, key, themes, viewports, opts = {}) {
  for (const [w, h, vp] of viewports) {
    for (const theme of themes) {
      await page.setViewportSize({ width: w, height: h });
      await gotoReady(url, theme);
      const name = `r61-${key}-${theme}-${vp}-ar.png`;
      evidence[`${key}_${theme}_${vp}`] = await shot(page, name, opts);
    }
  }
}

const desk = [[1440, 900, "1440"]];
const both = [
  [1440, 900, "1440"],
  [390, 844, "390"],
];
const themes = ["dark", "light"];
const dark = ["dark"];

// Traders
await capture("/admin/traders", "traders-list", themes, both, { fullDoc: true });

// Dialogs (dark 1440)
await page.setViewportSize({ width: 1440, height: 900 });
await gotoReady("/admin/traders", "dark");
const createBtn = page.getByRole("button", { name: /تاجر|إنشاء|إضافة|Create|Add/i }).first();
if (await createBtn.count()) {
  await createBtn.click().catch(() => {});
  await page.waitForTimeout(300);
  evidence.tradersCreate = await shot(page, "r61-traders-create-open-dark-1440-ar.png");
  await page.keyboard.press("Escape").catch(() => {});
}

const rowMenu = page.locator('[data-admin-traders] button, .rad-rowact button, button[aria-haspopup]').first();
// Prefer explicit reset / disable if present
const disableBtn = page.getByRole("button", { name: /تعطيل|Disable/i }).first();
if (await disableBtn.count()) {
  await disableBtn.click().catch(() => {});
  await page.waitForTimeout(300);
  evidence.tradersDisable = await shot(page, "r61-traders-disable-open-dark-1440-ar.png");
  await page.keyboard.press("Escape").catch(() => {});
}
const resetBtn = page.getByRole("button", { name: /إعادة تعيين|Reset/i }).first();
if (await resetBtn.count()) {
  await resetBtn.click().catch(() => {});
  await page.waitForTimeout(300);
  evidence.tradersReset = await shot(page, "r61-traders-reset-open-dark-1440-ar.png");
  const confirm = page.getByRole("button", { name: /تأكيد|Confirm|إعادة/i }).last();
  if (await confirm.count()) {
    await confirm.click().catch(() => {});
    await page.waitForTimeout(500);
    evidence.tradersTemp = await shot(page, "r61-traders-temp-password-dark-1440-ar.png");
  }
  await page.keyboard.press("Escape").catch(() => {});
}

// Products
await capture("/admin/products", "products-list", themes, [[390, 844, "390"]], {
  fullDoc: true,
});
if (productId) {
  await capture(`/admin/products/${productId}`, "product-editor", themes, desk, {
    fullDoc: true,
  });
}
await capture("/admin/products/new", "product-new", themes, desk, { fullDoc: true });

// Offers
await capture("/admin/offers/new", "offers-new", dark, desk, { fullDoc: true });
if (offerId) {
  await capture(`/admin/offers/${offerId}`, "offers-detail", dark, desk, {
    fullDoc: true,
  });
}

// Brokerage
await capture("/admin/brokerage", "brokerage-table", themes, desk, { fullDoc: true });
if (broId) {
  await capture(`/admin/brokerage/${broId}`, "brokerage-detail", themes, desk, {
    fullDoc: true,
  });
}

// Profile / security / settings
await capture("/admin/profile", "profile", themes, both, { fullDoc: true });
await capture("/admin/settings/security", "security", themes, both, { fullDoc: true });
await capture("/admin/settings", "settings", themes, desk, { fullDoc: true });

// Errors
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/forbidden?portal=admin`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
evidence.forbidden = await shot(page, "r61-forbidden-dark-1440-ar.png", { fullDoc: true });

await page.goto(`${BASE}/admin/this-route-does-not-exist-r61`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
evidence.notFound = await shot(page, "r61-404-dark-1440-ar.png", { fullDoc: true });

await page.goto(`${BASE}/dev/force-500`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(500);
evidence.err500 = await shot(page, "r61-500-dark-1440-ar.png", { fullDoc: true });

const manifest = {
  at: new Date().toISOString(),
  evidence,
  skeletonOnlyRoutes,
  note:
    skeletonOnlyRoutes.length === 0
      ? "No route remained skeleton-only after wait."
      : "Some routes still showed skeleton nodes after wait — see skeletonOnlyRoutes.",
};
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
await browser.close();
