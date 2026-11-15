/**
 * SH0 remainder: trader wholesale + admin request honest recapture + NOTES refresh.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/shots");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  process.env[line.slice(0, i).trim()] = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

fs.mkdirSync(OUT, { recursive: true });
const notes = [];

async function shot(page, name, see) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
  notes.push({ file: `${name}.png`, see });
  console.log(`OK ${name}: ${see}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
const page = await context.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(String(e.message || e)));
page.on("console", (m) => {
  if (m.type() === "error") errs.push(m.text());
});

// Admin login
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 25000 });

for (const [w, h, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle" });
  const href = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href]")].find((el) =>
      (el.getAttribute("href") || "").startsWith("/admin/requests/")
    );
    return a?.getAttribute("href") || null;
  });
  if (href) {
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(
      page,
      `sh0-admin-request-detail-${tag}-ar`,
      tag === "1440"
        ? "Admin retail RO detail dark RTL: shipping method shows 'غير محددة — يُؤكَّد مع الفريق' — no carrier/tracking block"
        : "Admin retail detail 390: same unconfirmed shipping line; handoff timeline not shipment lifecycle"
    );
  }

  await page.goto(`${BASE}/admin/wholesale`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(
    page,
    `sh0-admin-wholesale-list-${tag}-ar`,
    "Admin wholesale list empty/local — no rows; carrier/tracking only appears on detail when data exists"
  );

  await page.goto(`${BASE}/admin/deals`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(
    page,
    `sh0-admin-deal-list-${tag}-ar`,
    "Admin deals list — no shipping columns/fields on deals (expected gap)"
  );

  await page.goto(`${BASE}/admin/brokerage`, { waitUntil: "networkidle" });
  const bHref = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href]")].find((el) =>
      (el.getAttribute("href") || "").startsWith("/admin/brokerage/")
    );
    return a?.getAttribute("href") || null;
  });
  if (bHref) {
    await page.goto(`${BASE}${bHref}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await shot(
      page,
      `sh0-admin-brokerage-detail-${tag}-ar`,
      "Admin brokerage detail: shippingUsd/carrier/tracking if present — manual quote fields not rate engine"
    );
  } else {
    await shot(
      page,
      `sh0-admin-brokerage-list-${tag}-ar`,
      "Admin brokerage list — no detail row in local DB"
    );
  }
}

// Trader login (password reset by sh0-reset-trader.mjs)
await context.clearCookies();
await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
await page.fill(
  'input[name="email"]',
  process.env.TRADER_EMAIL || "trader@rareoud.local"
);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
try {
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
} catch {
  notes.push({
    file: "(none)",
    see: `Trader login still on ${page.url()} after reset — portal shots skipped`,
  });
  fs.writeFileSync(
    path.join(OUT, "NOTES.json"),
    JSON.stringify({ capturedAt: new Date().toISOString(), errs: errs.slice(0, 20), notes }, null, 2)
  );
  await browser.close();
  process.exit(0);
}

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
    "Trader wholesale form: ShippingCostSelector (same static rates as storefront) or empty-state if form gated"
  );

  const tDeal = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href]")].find((el) =>
      (el.getAttribute("href") || "").startsWith("/trader/deals/")
    );
    return a?.getAttribute("href") || null;
  });
  await page.goto(`${BASE}/trader/deals`, { waitUntil: "networkidle" });
  if (tDeal) {
    await page.goto(`${BASE}${tDeal}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await shot(
      page,
      `sh0-trader-deal-detail-${tag}-ar`,
      "Trader deal detail: no shipping destination/method/cost fields"
    );
  } else {
    await shot(
      page,
      `sh0-trader-deal-list-${tag}-ar`,
      "Trader deals list — no detail; deals have no shipping model fields"
    );
  }
}

// Preserve restored storefront SEE lines
notes.unshift(
  {
    file: "sh0-storefront-request-empty-1440-ar.png",
    see: "Storefront /request empty cart RTL: 'لا توجد قطع في طلبك' — shipping calculator not shown until cart has items",
  },
  {
    file: "sh0-storefront-request-shipping-1440-ar.png",
    see: "Storefront /request DE: destination select, 20kg oud heuristic, land 130 USD / air 150 USD cards with EUR alternate note",
  },
  {
    file: "sh0-storefront-request-shipping-390-ar.png",
    see: "Storefront /request DE at 390: same cards stacked; sticky summary shows تقدير الشحن 130 USD",
  }
);

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
console.log(`Wrote ${notes.length} notes → ${OUT}`);
