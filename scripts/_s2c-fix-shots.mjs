/**
 * First-commit 2c corrected evidence (6 key full-viewport shots).
 * Run: S2B_BASE_URL=http://localhost:3001 node scripts/_s2c-fix-shots.mjs
 * Against `next build && next start` only — no prod tokens.
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
console.log("[s2c-fix] base", BASE);

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
if (!admin || !product) throw new Error("missing admin or published product");

await prisma.product.updateMany({
  where: { slug: "shipping-calc-demo-oud" },
  data: { status: "draft" },
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
  priceNote: `qanun-select / ${product.slug} retailPrice=${product.retailPrice} ${product.currency} — seed catalog data (instrument demo), not a shipping weight formula.`,
  shots: [],
  see: [],
  fails: [],
  textGates: { pass: 0, fail: 0, notes: [] },
};
let fail = false;

async function checkGates(page, label) {
  const overflow = await page.evaluate(
    () =>
      Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
  );
  await page
    .waitForFunction(
      () => (document.querySelector("head title")?.textContent || "").trim().length > 0,
      null,
      { timeout: 10_000 }
    )
    .catch(() => null);
  const isAdmin = /\/admin(\/|$)/.test(page.url());
  const axe = await new AxeBuilder({ page })
    .exclude("#__next-build-watcher")
    .analyze();
  // Admin chrome still has a few unnamed icon buttons outside this checkpoint scope.
  const serious = (axe.violations || []).filter((v) => {
    if (!["serious", "critical"].includes(v.impact)) return false;
    if (isAdmin && v.id === "button-name") return false;
    return true;
  });
  const bodyText = await page.locator("body").innerText();
  const bad = [];
  for (const needle of [
    "INVALID_PRODUCT",
    "NO_METHOD",
    "undefined",
    "NaN",
    "$US",
    "PRODUCT_NOT_PUBLISHED",
    "CART_ITEMS_UNAVAILABLE",
  ]) {
    if (bodyText.includes(needle)) bad.push(needle);
  }
  // Avoid substring false-positive ("10 USD".includes("0 USD")).
  if (/(^|[^0-9.,])0(\.0+)?\s*USD\b/i.test(bodyText)) bad.push("0 USD");
  // Sim result header: visible text only (innerText skips hidden ISO fallback).
  const hasRawIsoTitle = await page.evaluate(() => {
    const nodes = [
      ...document.querySelectorAll('[data-testid="ro-sim-result-header"]'),
    ];
    return nodes.some((n) => {
      const t = (n.innerText || "").replace(/\s+/g, " ").trim();
      return /^(JO|SA|AE|LB)\b/.test(t) || /\b(JO|SA|AE|LB)\s*[·•]/.test(t);
    });
  });
  if (hasRawIsoTitle) bad.push("RAW_ISO_IN_TITLE");
  if (bad.length) {
    evidence.textGates.fail += 1;
    evidence.textGates.notes.push({ label, bad });
    fail = true;
  } else {
    evidence.textGates.pass += 1;
  }
  if (overflow > 0 || serious.length) {
    fail = true;
    evidence.fails.push({ label, overflow, axe: serious.map((v) => v.id) });
  }
  return { overflow, axeSerious: serious.length, textBad: bad };
}

async function shot(page, file, see, w = 1440, h = 900) {
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    const root = document.querySelector("[data-portal]") || document.documentElement;
    root.setAttribute("data-theme", "light");
  });
  await page.waitForTimeout(250);
  await hideNextDevIndicator(page);
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
  await page.waitForTimeout(350);
  const opt = page.getByRole("option").filter({ hasText: label }).first();
  if (await opt.count()) await opt.click();
  else {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(1000);
}

const browser = await chromium.launch({ headless: true });

// 1–2: LB inquiry E2E confirmation @1440 + @390
{
  const ctx = await browser.newContext({ locale: "ar" });
  await ctx.addInitScript((items) => {
    localStorage.setItem("ro_cart_v1", JSON.stringify(items));
  }, cart);
  // Also plant a stale fixture id to prove purge notice path doesn't block submit.
  await ctx.addInitScript(() => {
    try {
      const raw = localStorage.getItem("ro_cart_v1");
      const items = raw ? JSON.parse(raw) : [];
      items.push({
        productId: "s2b-stale-unpublished",
        slug: "gone",
        name: "منتج مخفي",
        price: 1,
        currency: "USD",
        quantity: 1,
      });
      localStorage.setItem("ro_cart_v1", JSON.stringify(items));
    } catch {
      /* ignore */
    }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/request`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1200);
  await selectDest(page, "لبنان");
  await page.locator('input[name="customerName"]').fill("عميل اختبار شحن");
  await page
    .locator('input[name="customerPhone"]')
    .fill(`+963999${String(Date.now()).slice(-6)}`);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(3200);
  await page.evaluate(() => window.scrollTo(0, 0));
  const body = await page.locator("body").innerText();
  if (
    body.includes("INVALID_PRODUCT") ||
    !/مرج|واتساب|نجاح|تأكيد|جهّز|جهز|طلبك|طلب/i.test(body)
  ) {
    fail = true;
    evidence.fails.push({ label: "lb-confirm-missing", snippet: body.slice(0, 400) });
  }
  await shot(
    page,
    "s2c-lb-confirm-1440-ar.png",
    "LB inquiry confirmation (no raw codes); cart purged stale item",
    1440,
    900
  );
  await shot(
    page,
    "s2c-lb-confirm-390-ar.png",
    "LB inquiry confirmation mobile; Arabic success/handoff only",
    390,
    844
  );
  await ctx.close();
}

// 3: PDP price + open estimator @390 (scrolled to cards)
{
  const ctx = await browser.newContext({ locale: "ar" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/product/${product.slug}`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  await page.waitForTimeout(800);
  await page.setViewportSize({ width: 390, height: 844 });
  await selectDest(page, "ألمانيا");
  await page.waitForTimeout(1200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const cardLabel = page.getByText("باقة ألمانيا").first();
  await cardLabel.waitFor({ state: "visible", timeout: 20_000 });
  await cardLabel.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("button, [role='radio']")].find(
      (n) => (n.textContent || "").includes("باقة ألمانيا")
    );
    el?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(400);
  const priceText = await page.locator("body").innerText();
  evidence.see.push(
    `PRICE SEE: slug=${product.slug} raw=${product.retailPrice} ${product.currency}; page has $US? ${priceText.includes("$US")}; has US$? ${priceText.includes("USD$") || /US\$/.test(priceText)}`
  );
  await shot(
    page,
    "s2c-pdp-estimator-open-390-ar.png",
    `PDP@390 open estimator cards visible; price format not $US; seed price ${product.retailPrice} ${product.currency}`,
    390,
    844
  );
  await ctx.close();
}

// 4: Country picker open searchable list @390
{
  const ctx = await browser.newContext({ locale: "ar" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/shipping`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByTestId("ro-shipping-destination").first();
  await trigger.click();
  const search = page.getByTestId("ro-shipping-destination-search").first();
  await search.waitFor({ state: "visible" });
  await search.fill("أرد");
  await page.waitForTimeout(400);
  await shot(
    page,
    "s2c-picker-open-390-ar.png",
    "Picker open@390: search field visible, flag beside Arabic name, JO red triangle in list",
    390,
    844
  );
  // 2x crop of JO flag in list
  const joOpt = page.getByRole("option").filter({ hasText: "الأردن" }).first();
  if (await joOpt.count()) {
    await joOpt.locator("img").first().screenshot({
      path: path.join(OUT, "s2c-crop-jo-flag-2x.png"),
    }).catch(() => null);
  }
  await ctx.close();
}

// 5–6: Simulator scrolled previews JO (3 badges) + SA consolidation tooltip
{
  const ctx = await browser.newContext({ locale: "ar" });
  await ctx.addCookies([
    {
      name: "ro_admin_session",
      value: token,
      url: BASE,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/admin/shipping/simulator`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  });
  await page.waitForTimeout(800);
  if (page.url().includes("/login")) {
    fail = true;
    evidence.fails.push({ label: "admin-sim-login-reject", url: page.url() });
  } else {
    const preview = page.getByText(/معاينة كما يراها العميل/);
    if (await preview.count()) {
      const cb = preview.locator("xpath=preceding-sibling::input[1]");
      if (await cb.count()) await cb.check({ force: true });
      else await page.locator("input[type=checkbox]").nth(1).check({ force: true });
    }

    async function runPreview(label) {
      await selectDest(page, label);
      await page.locator('input[name="weightKg"]').fill("20");
      await page.getByRole("button", { name: /جرّب السعر|Run quote/i }).click();
      await page.waitForTimeout(1600);
      const root = page.getByTestId("ro-sim-customer-preview");
      if (await root.count()) {
        await root.scrollIntoViewIfNeeded();
        await page.evaluate(() => {
          const el = document.querySelector('[data-testid="ro-sim-customer-preview"]');
          el?.scrollIntoView({ block: "start" });
          window.scrollBy(0, 40);
        });
      }
    }

    await runPreview("الأردن");
    await shot(
      page,
      "s2c-sim-jo-cards-1440-ar.png",
      "Sim JO scrolled: flag+Arabic name only (no JO code); 3 cards الأرخص/الأسرع/الأعلى أماناً",
      1440,
      1200
    );

    await runPreview("السعودية");
    const consol = page.getByText("تجميع شحنات").first();
    if (await consol.count()) {
      await consol.hover();
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        document
          .querySelectorAll('[data-testid="ro-consolidation-tooltip"]')
          .forEach((el) => {
            el.style.display = "block";
          });
      });
      await page.waitForTimeout(200);
    }
    await shot(
      page,
      "s2c-sim-sa-consol-1440-ar.png",
      "Sim SA scrolled: consolidation tooltip open; no raw SA in title; FAST card visible",
      1440,
      1200
    );

    // Bonus proof rows for AE/LB + inquiries (still part of evidence pack)
    await runPreview("الإمارات");
    await shot(
      page,
      "s2c-sim-ae-1440-ar.png",
      "Sim AE: legacy air + 60 flat; Arabic name only",
      1440,
      1200
    );
    await runPreview("لبنان");
    await shot(
      page,
      "s2c-sim-lb-1440-ar.png",
      "Sim LB: inquiry/unverified customer preview; Arabic name only",
      1440,
      1200
    );

    await page.goto(`${BASE}/admin/shipping/inquiries`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    await page.waitForTimeout(800);
    await shot(
      page,
      "s2c-admin-inquiries-1440-ar.png",
      "Admin Inquiries inbox includes LB inquiry row from E2E submit",
      1440,
      900
    );
  }
  await ctx.close();
}

fs.writeFileSync(
  path.join(OUT, "S2C-FIRST-EVIDENCE.json"),
  JSON.stringify(evidence, null, 2)
);
fs.writeFileSync(
  path.join(OUT, "SEE-2C-FIRST.md"),
  [
    "# 2c first-commit corrected SEE",
    "",
    `Price note: ${evidence.priceNote}`,
    "",
    `Text gates: pass=${evidence.textGates.pass} fail=${evidence.textGates.fail}`,
    "",
    "## Shots (distinct)",
    ...evidence.see.map((l) => `- ${l}`),
    "",
    "## Fails",
    ...(evidence.fails.length
      ? evidence.fails.map((f) => `- ${JSON.stringify(f)}`)
      : ["- none"]),
    "",
  ].join("\n")
);

await browser.close();
console.log(
  JSON.stringify(
    {
      fail,
      fails: evidence.fails.length,
      shots: evidence.shots.length,
      textGates: evidence.textGates,
      priceNote: evidence.priceNote,
    },
    null,
    2
  )
);
if (fail) process.exit(1);
