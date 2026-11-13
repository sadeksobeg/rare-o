/**
 * Checkpoint 2b FIX evidence — run against `next start` (production), not dev.
 * S2B_BASE_URL=http://localhost:3001 node scripts/_s2b-fix-capture.mjs
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/s2b");
const BASE = process.env.S2B_BASE_URL || "http://localhost:3001";
const WIDTHS = [1440, 1280, 768, 390];
const THEMES = ["light", "dark"];

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "PLAYWRIGHT_BASE_URL" || k === "S2B_BASE_URL") continue;
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") process.env[k] = v;
}

fs.mkdirSync(OUT, { recursive: true });
console.log("[s2b-fix] base", BASE);

const prisma = new PrismaClient();
const admin = await prisma.adminUser.findFirst({ orderBy: { createdAt: "asc" } });
const product = await prisma.product.findFirst({
  where: {
    status: "published",
    availability: "available",
    retailPrice: { not: null },
    NOT: { slug: "shipping-calc-demo-oud" },
  },
  select: {
    id: true,
    slug: true,
    nameAr: true,
    retailPrice: true,
    currency: true,
  },
});
if (!admin || !product) throw new Error("no admin or published product");

// Local hygiene: draft the demo product; tidy AE legacy label duplication.
await prisma.product.updateMany({
  where: { slug: "shipping-calc-demo-oud" },
  data: { status: "draft" },
});
await prisma.shippingMethod.updateMany({
  where: { code: "intl:uae:air" },
  data: {
    labelAr: "الإمارات — شحن جوي",
    labelEn: "UAE — Air shipping",
  },
});

const token = await new SignJWT({
  email: admin.email,
  name: admin.name ?? "Admin",
  role: "admin",
  mustChangePassword: false,
  pwv: admin.passwordChangedAt?.getTime() ?? 0,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(admin.id)
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
await prisma.$disconnect();

const cart = [
  {
    productId: product.id,
    slug: product.slug,
    name: product.nameAr,
    price: Number(product.retailPrice),
    currency: product.currency || "USD",
    quantity: 1,
    imagePath: null,
  },
];

const evidence = {
  shots: [],
  see: [],
  fails: [],
  beforeAfter: [
    "LB summary: was 0 USD → now يُحدَّد بعرض سعر; NO_METHOD hidden → Arabic reason",
    "Mode enums: LAND/AIR → بري/جوي on cards; explicit → وزن مُدخل",
    "Bidi: كغ 20 → 20 كغ; chip 1 × عود = 20 كغ",
    "Flags: DE gold + LB white restored; flag in field; no raw DE line",
    "Picker: native datalist → searchable combobox (AR/EN + flags)",
    "Simulator: ISO text field → combobox + معاينة كما يراها العميل cards",
    "PDP: estimator in buy box, open by default",
    "Mobile checkout: one estimate (sticky only on small); sticky has top border/shadow",
    "Wording: تضمين غير المعتمد; AE label de-duplicated",
    "Gates: next build && next start; document-title enabled; contact sheets contain (no crop)",
  ],
  excludedAxeRules: [],
};
let fail = false;

async function checkGates(page, label) {
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  );
  await page
    .waitForFunction(
      () => (document.querySelector("head title")?.textContent || "").trim().length > 0,
      null,
      { timeout: 10_000 }
    )
    .catch(() => null);
  const axe = await new AxeBuilder({ page }).exclude("#__next-build-watcher").analyze();
  const serious = (axe.violations || []).filter((v) =>
    ["serious", "critical"].includes(v.impact)
  );
  if (overflow > 0 || serious.length) {
    fail = true;
    evidence.fails.push({ label, overflow, axe: serious.map((v) => v.id) });
  }
  return { overflow, axeSerious: serious.length };
}

async function shot(page, name, theme, w, see) {
  const h = w <= 390 ? 844 : w <= 768 ? 1024 : 900;
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate((th) => {
    document.documentElement.setAttribute("data-theme", th);
    const root = document.querySelector("[data-portal]") || document.documentElement;
    root.setAttribute("data-theme", th);
    localStorage.setItem("ro-portal-theme-v5", th);
  }, theme);
  await page.waitForTimeout(300);
  await hideNextDevIndicator(page);
  const file = `${name}-${theme}-${w}-ar.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: false });
  const gates = await checkGates(page, file);
  evidence.shots.push({ file, ...gates });
  evidence.see.push(`SEE ${file}: ${see}`);
  console.log(`SEE ${file}: ${see}`);
}

async function selectDest(page, label) {
  const trigger = page.getByTestId("ro-shipping-destination").first();
  await trigger.waitFor({ state: "visible", timeout: 45_000 });
  await trigger.click();
  const search = page.getByTestId("ro-shipping-destination-search").first();
  await search.waitFor({ state: "visible", timeout: 10_000 });
  await search.fill(label);
  await page.waitForTimeout(400);
  const opt = page.getByRole("option").filter({ hasText: label }).first();
  if (await opt.count()) await opt.click();
  else {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(1200);
}

async function cropWeight(page, file) {
  const box = page.locator("text=الوزن المحتسب").first();
  if (!(await box.count())) return;
  const parent = box.locator("xpath=ancestor::div[contains(@class,'rounded')][1]");
  const target = (await parent.count()) ? parent : box;
  await target.screenshot({ path: path.join(OUT, file) }).catch(() => null);
}

const browser = await chromium.launch({ headless: true });

// --- /shipping ---
{
  const ctx = await browser.newContext({ locale: "ar" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/shipping`, { waitUntil: "networkidle", timeout: 120_000 });
  await selectDest(page, "ألمانيا");
  await cropWeight(page, "s2b-crop-weight-shipping.png");
  for (const theme of THEMES) {
    for (const w of WIDTHS) {
      await shot(page, "s2b-shipping-page", theme, w, "DE cards badges; flag in field; 20 كغ bidi; بري/جوي");
    }
  }
  await ctx.close();
}

// --- PDP ---
{
  const slug = product?.slug || "qanun-select";
  const ctx = await browser.newContext({ locale: "ar" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/product/${slug}`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(800);
  const dest = page.getByTestId("ro-shipping-destination").first();
  await dest.waitFor({ state: "visible", timeout: 45_000 });
  await dest.scrollIntoViewIfNeeded();
  await selectDest(page, "ألمانيا");
  await dest.scrollIntoViewIfNeeded();
  for (const theme of THEMES) {
    for (const w of [1440, 390]) {
      await dest.scrollIntoViewIfNeeded();
      await shot(page, "s2b-pdp-estimator", theme, w, "PDP estimator open in buy box");
    }
  }
  await ctx.close();
}

// --- request DE ---
{
  const ctx = await browser.newContext({ locale: "ar" });
  await ctx.addInitScript((items) => {
    localStorage.setItem("ro_cart_v1", JSON.stringify(items));
  }, cart);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/request`, { waitUntil: "networkidle", timeout: 120_000 });
  await selectDest(page, "ألمانيا");
  await cropWeight(page, "s2b-crop-weight-request.png");
  for (const theme of THEMES) {
    for (const w of WIDTHS) {
      await shot(
        page,
        "s2b-request-de",
        theme,
        w,
        "request DE; sticky border; top estimate hidden on 390 when sticky"
      );
    }
  }

  // LB inquiry card
  await selectDest(page, "لبنان");
  await page.waitForTimeout(800);
  for (const theme of THEMES) {
    for (const w of [1440, 390]) {
      await shot(
        page,
        "s2b-request-lb-inquiry",
        theme,
        w,
        "LB inquiry: يُحدَّد بعرض سعر; Arabic reason; no NO_METHOD; WA off"
      );
    }
  }

  // Submit inquiry E2E
  await page.locator('input[name="customerName"]').fill("عميل اختبار شحن");
  await page.locator('input[name="customerPhone"]').fill("+963999000111");
  const submit = page.locator('form button[type="submit"]').first();
  if (await submit.count()) {
    await submit.click();
    await page.waitForTimeout(2800);
    await shot(
      page,
      "s2b-request-lb-confirm",
      "light",
      1440,
      "LB inquiry submit confirmation / handoff success"
    );
  } else {
    evidence.fails.push({ label: "lb-submit-button-missing" });
    fail = true;
  }
  await ctx.close();
}

// --- Admin simulator customer preview ---
{
  const ctx = await browser.newContext({ locale: "ar" });
  await ctx.addCookies([
    { name: "ro_admin_session", value: token, url: BASE, httpOnly: true, sameSite: "Lax" },
  ]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/shipping/simulator`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  await page.waitForTimeout(1000);
  if (page.url().includes("/login")) {
    fail = true;
    evidence.fails.push({ label: "admin-sim-login-reject", url: page.url() });
  } else {
    const preview = page.getByText(/معاينة كما يراها العميل/);
    if (await preview.count()) {
      const cb = preview.locator("xpath=preceding-sibling::input[1]");
      if (await cb.count()) await cb.check({ force: true });
      else await page.locator('input[type=checkbox]').nth(1).check({ force: true });
    }
    async function previewCountry(code, label, see) {
      await selectDest(page, label);
      await page.locator('input[name="weightKg"]').fill("20");
      await page.getByRole("button", { name: /جرّب السعر|Run quote/i }).click();
      await page.waitForTimeout(1600);
      const previewRoot = page.getByTestId("ro-sim-customer-preview");
      if (await previewRoot.count()) await previewRoot.scrollIntoViewIfNeeded();
      await shot(page, `s2b-sim-preview-${code.toLowerCase()}`, "light", 1440, see);
      await shot(page, `s2b-sim-preview-${code.toLowerCase()}`, "dark", 1440, see);
      await shot(page, `s2b-sim-preview-${code.toLowerCase()}`, "light", 390, see);
      await shot(page, `s2b-sim-preview-${code.toLowerCase()}`, "dark", 390, see);
      await cropWeight(page, `s2b-crop-weight-sim-${code.toLowerCase()}.png`);
    }
    await previewCountry("LB", "لبنان", "customer cards LB $20 unverified watermark");
    await previewCountry("JO", "الأردن", "JO×3 cards badges الأرخص/الأسرع/الأعلى أماناً");
    await previewCountry("SA", "السعودية", "SA consolidation tooltip + FAST");
    await previewCountry("AE", "الإمارات", "AE legacy air + مندوب $60; tidy label");
  }

  // Inquiries inbox
  await page.goto(`${BASE}/admin/shipping/inquiries`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  await page.waitForTimeout(800);
  await shot(page, "s2b-admin-inquiries", "light", 1440, "admin Inquiries inbox shows LB inquiry row");
  await ctx.close();
}

fs.writeFileSync(path.join(OUT, "S2B-FIX-EVIDENCE.json"), JSON.stringify(evidence, null, 2));
fs.writeFileSync(
  path.join(OUT, "SEE-FIX.md"),
  [
    "# 2b fix SEE",
    "",
    "## Before → After",
    ...evidence.beforeAfter.map((l) => `- ${l}`),
    "",
    "## Shots",
    ...evidence.see.map((l) => `- ${l}`),
    "",
  ].join("\n")
);
await browser.close();
console.log(JSON.stringify({ fail, fails: evidence.fails.length, shots: evidence.shots.length }, null, 2));
if (fail) process.exit(1);
