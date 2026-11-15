/**
 * SH0 — capture current shipping-related UI (1440 + 390, AR).
 * Run: node scripts/sh0-shipping-shots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/shots");
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
}
loadDotEnv();

fs.mkdirSync(OUT, { recursive: true });

const notes = [];

async function shot(page, name, see) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
  notes.push({ file: path.basename(file), see });
  console.log(`OK ${name}: ${see}`);
}

async function consoleErrors(page) {
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errs.push(msg.text());
  });
  return errs;
}

async function adminLogin(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL || "");
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD || "");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 });
}

async function traderLogin(page) {
  // Local seed defaults (prisma/seed.ts) when TRADER_* unset in .env
  const email =
    process.env.TRADER_EMAIL ||
    process.env.DEMO_TRADER_EMAIL ||
    "trader@rareoud.local";
  const password =
    process.env.TRADER_PASSWORD ||
    process.env.DEMO_TRADER_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    "";
  if (!password) return false;
  await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('button[type="submit"]').first().click();
  try {
    await page.waitForURL((u) => !u.pathname.includes("/login"), {
      timeout: 20000,
    });
    return true;
  } catch {
    return false;
  }
}

async function firstDetailHref(page, listPath, linkPrefix) {
  await page.goto(`${BASE}${listPath}`, { waitUntil: "networkidle" });
  const href = await page.evaluate((prefix) => {
    const a = [...document.querySelectorAll("a[href]")].find((el) =>
      (el.getAttribute("href") || "").startsWith(prefix)
    );
    return a ? a.getAttribute("href") : null;
  }, linkPrefix);
  return href;
}

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
const page = await context.newPage();
const errs = await consoleErrors(page);

// --- Storefront request / shipping step ---
for (const [w, h, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  await page.setViewportSize({ width: w, height: h });
  // Seed a one-oud cart so ShippingCostSelector renders
  await page.addInitScript(() => {
    const item = {
      productId: "seed-oud-vip",
      slug: "oud-vip-signature",
      name: "عود توقيع VIP",
      price: 8900,
      currency: "USD",
      quantity: 1,
    };
    localStorage.setItem("ro_cart_v1", JSON.stringify([item]));
  });
  await page.goto(`${BASE}/request`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const select = page.locator("select").first();
  if (await select.count()) {
    try {
      await select.selectOption({ label: "ألمانيا" });
    } catch {
      await select.selectOption({ value: "DE" }).catch(() => {});
    }
    await page.waitForTimeout(400);
  }
  await shot(
    page,
    `sh0-storefront-request-shipping-${tag}-ar`,
    tag === "1440"
      ? "Storefront /request DE: land/air method cards with USD (+ EUR alternate) and 20kg oud heuristic"
      : "Storefront /request DE at 390: method cards stacked under destination"
  );
}

// --- Admin ---
await adminLogin(page);

for (const [w, h, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  await page.setViewportSize({ width: w, height: h });

  const reqHref = await firstDetailHref(
    page,
    "/admin/requests",
    "/admin/requests/"
  );
  if (reqHref) {
    await page.goto(`${BASE}${reqHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(
      page,
      `sh0-admin-request-detail-${tag}-ar`,
      "Admin retail request detail: shipping method/code fields visible or 'unconfirmed'"
    );
  } else {
    await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle" });
    await shot(
      page,
      `sh0-admin-request-list-${tag}-ar`,
      "Admin requests list — no detail row to open (empty or gated)"
    );
  }

  const whHref = await firstDetailHref(
    page,
    "/admin/wholesale",
    "/admin/wholesale/"
  );
  if (whHref) {
    await page.goto(`${BASE}${whHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(
      page,
      `sh0-admin-wholesale-detail-${tag}-ar`,
      "Admin wholesale detail: carrier/tracking/shipping estimate panel"
    );
  } else {
    await page.goto(`${BASE}/admin/wholesale`, { waitUntil: "networkidle" });
    await shot(
      page,
      `sh0-admin-wholesale-list-${tag}-ar`,
      "Admin wholesale list — no detail row"
    );
  }

  const dealHref = await firstDetailHref(page, "/admin/deals", "/admin/deals/");
  if (dealHref) {
    await page.goto(`${BASE}${dealHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(
      page,
      `sh0-admin-deal-detail-${tag}-ar`,
      "Admin deal detail: no dedicated shipping block expected (audit)"
    );
  } else {
    await page.goto(`${BASE}/admin/deals`, { waitUntil: "networkidle" });
    await shot(
      page,
      `sh0-admin-deal-list-${tag}-ar`,
      "Admin deals list — no detail row"
    );
  }
}

// --- Trader ---
const traderOk = await traderLogin(page);
if (traderOk) {
  for (const [w, h, tag] of [
    [1440, 900, "1440"],
    [390, 844, "390"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${BASE}/trader/wholesale`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await shot(
      page,
      `sh0-trader-wholesale-form-${tag}-ar`,
      "Trader wholesale form with ShippingCostSelector"
    );

    const tWh = await firstDetailHref(
      page,
      "/trader/wholesale",
      "/trader/wholesale/"
    );
    if (tWh) {
      await page.goto(`${BASE}${tWh}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await shot(
        page,
        `sh0-trader-wholesale-detail-${tag}-ar`,
        "Trader wholesale detail: shipping estimate and/or carrier tracking"
      );
    }

    const tDeal = await firstDetailHref(page, "/trader/deals", "/trader/deals/");
    if (tDeal) {
      await page.goto(`${BASE}${tDeal}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await shot(
        page,
        `sh0-trader-deal-detail-${tag}-ar`,
        "Trader deal detail: shipping fields absent (expected)"
      );
    }
  }
} else {
  notes.push({
    file: "(none)",
    see: "Trader login skipped — TRADER_EMAIL/PASSWORD not in .env",
  });
}

fs.writeFileSync(
  path.join(OUT, "NOTES.json"),
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      base: BASE,
      consoleErrorsSample: errs.slice(0, 20),
      notes,
    },
    null,
    2
  )
);

await browser.close();
console.log(`Wrote ${notes.length} shots → ${OUT}`);
