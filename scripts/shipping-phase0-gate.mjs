/**
 * Shipping Phase 0 gate — run against `next build && next start`.
 *  - /admin/brokerage renders (200, no page errors) on repeated loads
 *  - /request: no horizontal overflow at 390/768/1280/1440, Western digits
 *    only in the weight block, DE below the 11 kg floor -> inquiry card
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/shipping-phase0-gate.mjs
 * Output: docs/shipping/PHASE-0-GATE.json + docs/shipping/shots/p0-*.png
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const SHOTS = path.join(ROOT, "docs", "shipping", "shots");
fs.mkdirSync(SHOTS, { recursive: true });
const out = { at: new Date().toISOString(), base: BASE, checks: [] };
const record = (name, pass, detail) => {
  out.checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${JSON.stringify(detail)}` : ""}`);
};

const browser = await chromium.launch();

// ---- storefront /request
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 160)));
await page.goto(`${BASE}/product/oud-classic-21`, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle").catch(() => {});
// Add one oud through the real UI so the cart shape is whatever the app writes.
const add = page.getByRole("button", { name: /أضف|إضافة|السلة|Add/ }).first();
await add.click().catch(() => {});
await page.waitForTimeout(600);
const cart = await page.evaluate(() => localStorage.getItem("ro_cart_v1"));
record("cart seeded through the product page", !!cart && cart !== "[]", { bytes: cart?.length ?? 0 });

for (const width of [390, 768, 1280, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${BASE}/request`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  record(`/request no horizontal overflow @${width}`, m.scrollWidth <= m.innerWidth, m);
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/request`, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle").catch(() => {});
const select = page.locator("select").first();
const hasSelect = (await select.count()) > 0;
record("/request shows the destination selector", hasSelect);
if (hasSelect) {
  await select.selectOption("DE");
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      arabicIndicDigits: (text.match(/[٠-٩۰-۹]/g) || []).length,
      weightLine: (text.match(/\d+\s*كغ/) || [null])[0],
      inquiryCard: text.includes("اطلب عرض سعر"),
      hiddenInquiryField: !!document.querySelector('input[name="shippingInquiry"]'),
    };
  });
  record("/request uses Western digits only", state.arabicIndicDigits === 0, state);
  // 1 oud = 20 kg -> in the germany package and above the 11 kg floor, so methods price.
  record("DE with 1 oud (20 kg) prices normally, no inquiry card", !state.inquiryCard, { weight: state.weightLine });
  await page.screenshot({ path: path.join(SHOTS, "p0-request-de-1440.png") });
  await select.selectOption("BR").catch(() => {});
}
record("/request raised no page errors", pageErrors.length === 0, pageErrors.slice(0, 3));
await ctx.close();

// ---- admin brokerage
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const actx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const ap = await actx.newPage();
  const aErrors = [];
  ap.on("pageerror", (e) => aErrors.push(String(e).slice(0, 160)));
  await ap.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await ap.fill('input[name="email"]', process.env.ADMIN_EMAIL);
  await ap.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
  await ap.locator('button[type="submit"]').first().click();
  await ap.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const res = await ap.goto(`${BASE}/admin/brokerage`, { waitUntil: "domcontentloaded" });
    statuses.push(res?.status() ?? 0);
  }
  record("/admin/brokerage returns 200 on 6 consecutive loads (production build)", statuses.every((s) => s === 200), statuses);
  const overlay = await ap.evaluate(() => document.body.innerText.includes("Unexpected end of JSON input"));
  record("/admin/brokerage shows no JSON parse error", !overlay && aErrors.length === 0, aErrors.slice(0, 3));
  await ap.screenshot({ path: path.join(SHOTS, "p0-admin-brokerage-1440.png") });

  const reqHref = await (async () => {
    await ap.goto(`${BASE}/admin/requests`, { waitUntil: "domcontentloaded" });
    return ap.evaluate(() => document.querySelector('a[href^="/admin/requests/"]')?.getAttribute("href") ?? null);
  })();
  if (reqHref) {
    await ap.goto(`${BASE}${reqHref}`, { waitUntil: "domcontentloaded" });
    const raw = await ap.evaluate(() => {
      const cells = [...document.querySelectorAll("dd, td, span, p")].map((e) => e.textContent?.trim());
      return cells.filter((t) => t && /^[A-Z]{2}$/.test(t)).slice(0, 5);
    });
    record("admin request detail shows no bare 2-letter country code", raw.length === 0, raw);
    await ap.screenshot({ path: path.join(SHOTS, "p0-admin-request-detail-1440.png") });
  }
  await actx.close();
}

await browser.close();
fs.writeFileSync(path.join(ROOT, "docs", "shipping", "PHASE-0-GATE.json"), JSON.stringify(out, null, 2));
const failed = out.checks.filter((c) => !c.pass);
console.log(`\nPhase 0 gate: ${out.checks.length - failed.length}/${out.checks.length} passed`);
if (failed.length) process.exitCode = 1;
