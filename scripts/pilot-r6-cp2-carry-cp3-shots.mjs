/**
 * Round 6 — carry-over fixes + Checkpoint 3 evidence captures.
 * Hides sticky/fixed chrome for full-page shots to avoid blank bands / mid tab bars.
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

function prismaFirst(model, whereExtra = "") {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}${whereExtra}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`,
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
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForFunction(
    (t) => {
      const root = document.querySelector('[data-portal="admin"]');
      if (!root) return t === "dark";
      return (
        root.getAttribute("data-theme") === t &&
        (root.getAttribute("data-theme-ready") === "true" || true)
      );
    },
    theme,
    { timeout: 20000 }
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
}

/** Full-page: hide sticky/fixed chrome so shots aren't clipped mid-page. */
async function hideChromeForFullPage(page) {
  await page.addStyleTag({
    content: `
      .rad-top, .rad-side, .rad-btm, .rad-psave, [data-ro-mobile-tabs],
      .rad-snav { position: static !important; }
      .rad-psave, .rad-top { position: relative !important; }
    `,
  });
}

async function shot(page, name, { fullPage = false } = {}) {
  await hideNextDevIndicator(page);
  await freeze(page);
  if (fullPage) await hideChromeForFullPage(page);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage });
  console.log("wrote", name);
  return name;
}

const productId = prismaFirst("product");
const offerId = prismaFirst("publicCuratedOffer");
const broId = prismaFirst("brokerageRequest");
const dealId = prismaFirst("dealProposal");

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "ar",
});
const page = await context.newPage();

// —— Login (CP3) ——
await seedTheme(page, "dark");
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await shot(page, "r6-cp3-login-dark-1440-ar.png");
await page.setViewportSize({ width: 390, height: 844 });
await shot(page, "r6-cp3-login-dark-390-ar.png");
await page.setViewportSize({ width: 1440, height: 900 });

for (const st of ["error", "lock", "2fa", "recovery"]) {
  await page.goto(`${BASE}/dev/auth-states?state=${st}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await shot(page, `r6-cp3-auth-${st}-dark-1440-ar.png`);
}

// —— Authenticate ——
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });

const shots = [];

async function captureAdmin(url, basename, themes, viewports, opts = {}) {
  for (const [w, h, vp] of viewports) {
    await page.setViewportSize({ width: w, height: h });
    for (const theme of themes) {
      await seedTheme(page, theme);
      await page.goto(`${BASE}${url}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await setTheme(page, theme);
      const name = `${basename}-${theme}-${vp}-ar.png`;
      shots.push(await shot(page, name, opts));
    }
  }
}

const desk = [[1440, 900, "1440"]];
const deskMobile = [
  [1440, 900, "1440"],
  [390, 844, "390"],
];
const darkOnly = ["dark"];
const both = ["dark", "light"];

await captureAdmin("/admin/traders", "r6-traders-list", both, deskMobile);
await captureAdmin("/admin/products", "r6-products-list", both, deskMobile);
if (productId) {
  await captureAdmin(
    `/admin/products/${productId}`,
    "r6-product-editor",
    both,
    deskMobile,
    { fullPage: true }
  );
}
await captureAdmin("/admin/products/new", "r6-product-new", both, desk, {
  fullPage: true,
});
await captureAdmin("/admin/offers/new", "r6-offers-new", both, deskMobile);
if (offerId) {
  await captureAdmin(
    `/admin/offers/${offerId}`,
    "r6-offers-detail",
    both,
    deskMobile
  );
}
if (dealId) {
  await captureAdmin(
    `/admin/deals/${dealId}`,
    "r6-deal-negotiation",
    darkOnly,
    desk,
    { fullPage: true }
  );
}
await captureAdmin("/admin/brokerage", "r6-brokerage-kanban", darkOnly, desk);
if (broId) {
  await captureAdmin(
    `/admin/brokerage/${broId}`,
    "r6-brokerage-detail",
    darkOnly,
    deskMobile,
    { fullPage: true }
  );
}

// Traders dialogs + temp password (/dev fixture)
await page.setViewportSize({ width: 1440, height: 900 });
await seedTheme(page, "dark");
await page.goto(`${BASE}/dev/ui-kit/traders`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await setTheme(page, "dark");
shots.push(await shot(page, "r6-traders-temp-password-dark-1440-ar.png"));
// Close auto-open temp-password modal (requires ack checkbox).
const ack = page.locator('[data-dev-traders-dialogs] input[type="checkbox"]');
if ((await ack.count()) > 0) {
  await ack.first().check();
  await page.locator('button:has-text("إغلاق")').click();
  await page.waitForTimeout(150);
}
await page.locator('button:has-text("إنشاء تاجر")').click({ force: true });
await page.waitForTimeout(200);
shots.push(await shot(page, "r6-traders-create-open-dark-1440-ar.png"));
await page.keyboard.press("Escape");
await page.waitForTimeout(150);
await page.locator('button:has-text("تعطيل")').click({ force: true });
await page.waitForTimeout(200);
shots.push(await shot(page, "r6-traders-disable-open-dark-1440-ar.png"));
await page.keyboard.press("Escape");
await page.waitForTimeout(150);
await page
  .locator('button:has-text("إعادة تعيين كلمة المرور")')
  .click({ force: true });
await page.waitForTimeout(200);
shots.push(await shot(page, "r6-traders-reset-open-dark-1440-ar.png"));
await page.keyboard.press("Escape");

// CP3 profile / security / errors
await captureAdmin("/admin/profile", "r6-cp3-profile", both, deskMobile);
await captureAdmin(
  "/admin/settings/security",
  "r6-cp3-settings-security",
  both,
  deskMobile
);

await page.goto(`${BASE}/forbidden?portal=admin`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
shots.push(await shot(page, "r6-cp3-forbidden-dark-1440-ar.png"));

await page.goto(`${BASE}/this-route-does-not-exist-r6`, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
shots.push(await shot(page, "r6-cp3-404-dark-1440-ar.png"));

const manifest = {
  generatedAt: new Date().toISOString(),
  shots,
  notes:
    "Carry-over + CP3. Full-page shots hide sticky chrome. Auth states from /dev fixtures (no real lock/2FA submit).",
};
fs.writeFileSync(
  path.join(OUT, "r6-cp2-carry-cp3-evidence.json"),
  JSON.stringify(manifest, null, 2)
);
console.log(JSON.stringify(manifest, null, 2));
await browser.close();
