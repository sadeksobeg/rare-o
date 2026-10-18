/**
 * C1 automated page checks + screenshots (AR/EN × 390/768/1440).
 * Requires: dev server on PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000)
 * and Playwright Chromium installed.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const OUT = path.join(process.cwd(), "docs", "pro-readiness", "screens");
const WIDTHS = [390, 768, 1440];
const LOCALES = ["ar", "en"];

const PUBLIC = ["/", "/catalog", "/cart", "/request", "/offers", "/contact", "/privacy"];
const ADMIN = [
  "/admin/login",
  "/admin",
  "/admin/requests",
  "/admin/deals",
  "/admin/wholesale",
  "/admin/customers",
  "/admin/inbox",
  "/admin/traders",
  "/admin/products",
];
const TRADER = ["/trader/login", "/trader", "/trader/deals", "/trader/wholesale", "/trader/offers", "/trader/profile"];

const LATIN_ENUM =
  /\b(prepared|submitted|propose_price|trader_accepted|status_changed|handoff_opened|ready_for_handoff)\b/i;

function slug(route) {
  return route.replace(/\//g, "_").replace(/^_/, "") || "home";
}

async function auditPage(page, route, locale, width) {
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => failed.push(`${r.method()} ${r.url()}`));

  const url = `${BASE}${route}${route.includes("?") ? "&" : "?"}lang=${locale}`;
  await page.setViewportSize({ width, height: 900 });
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }).catch((e) => {
    errors.push(`goto: ${e.message}`);
    return null;
  });

  const overflow = await page
    .evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    })
    .catch(() => null);

  const bodyText = await page.locator("body").innerText().catch(() => "");
  const latinInAr =
    locale === "ar" && LATIN_ENUM.test(bodyText) ? bodyText.match(LATIN_ENUM)?.[0] : null;

  const brokenImgs = await page
    .evaluate(() =>
      [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src)
    )
    .catch(() => []);

  const dir = path.join(OUT, locale, String(width));
  mkdirSync(dir, { recursive: true });
  const shot = path.join(dir, `${slug(route)}.png`);
  await page.screenshot({ path: shot, fullPage: true }).catch(() => null);

  return {
    route,
    locale,
    width,
    status: res?.status() ?? 0,
    overflow,
    consoleErrors: errors,
    failedRequests: failed.slice(0, 5),
    brokenImages: brokenImgs.slice(0, 5),
    latinEnumInAr: latinInAr,
    screenshot: existsSync(shot) ? path.relative(process.cwd(), shot) : null,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PW_CHANNEL || "chrome",
  });

  const results = [];

  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext();
      const page = await context.newPage();
      for (const route of [...PUBLIC, ...ADMIN, ...TRADER]) {
        results.push(await auditPage(page, route, locale, width));
      }
      await context.close();
    }
  }

  await browser.close();

  const reportPath = path.join(OUT, "AUDIT-RESULTS.json");
  writeFileSync(reportPath, JSON.stringify(results, null, 2));

  const sheet = ["# Screenshot contact sheet", "", "| Route | Locale | Width | Shot | Issues |", "|---|---|---|---|---|"];
  for (const r of results) {
    const issues = [];
    if (r.overflow) issues.push("overflow");
    if (r.consoleErrors?.length) issues.push(`console:${r.consoleErrors.length}`);
    if (r.latinEnumInAr) issues.push(`latin:${r.latinEnumInAr}`);
    if (r.brokenImages?.length) issues.push(`imgs:${r.brokenImages.length}`);
    sheet.push(
      `| \`${r.route}\` | ${r.locale} | ${r.width} | ${r.screenshot ?? "—"} | ${issues.join("; ") || "ok"} |`
    );
  }
  writeFileSync(path.join(OUT, "CONTACT-SHEET.md"), sheet.join("\n"));
  console.log(`c1-page-audit: ${results.length} pages → ${reportPath}`);
  const bad = results.filter(
    (r) => r.overflow || r.consoleErrors?.length || r.latinEnumInAr || (r.status && r.status >= 500)
  );
  console.log(`issues: ${bad.length}`);
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
