/**
 * D1 — axe on all C1 routes × ar/en × 390 + 1440.
 * Exit 1 on critical or serious violations.
 * Output: docs/pro-readiness/AXE-RESULTS.json
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "pro-readiness");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const WIDTHS = [390, 1440];
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
  "/admin/categories",
];
const TRADER = [
  "/trader/login",
  "/trader",
  "/trader/deals",
  "/trader/wholesale",
  "/trader/offers",
  "/trader/profile",
];

function storefrontPath(routePath, locale) {
  if (routePath.startsWith("/admin") || routePath.startsWith("/trader")) {
    return routePath;
  }
  if (locale === "en") {
    return routePath === "/" ? "/en" : `/en${routePath}`;
  }
  return routePath;
}

function routeUrl(routePath, locale) {
  const p = storefrontPath(routePath, locale);
  const sep = p.includes("?") ? "&" : "?";
  return `${BASE}${p}${sep}lang=${locale}`;
}

async function runAxeOnPage(page, entry) {
  const { route, locale, width, url } = entry;
  await page.setViewportSize({ width, height: 900 });
  // catalog/home can keep long-polling or image work; networkidle is flaky on Windows.
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(500);
  const analysis = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const bad = analysis.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact)
  );

  return {
    route,
    locale,
    width,
    url,
    status: res?.status() ?? 0,
    violationCount: analysis.violations.length,
    failed: bad.length > 0,
    seriousOrCritical: bad.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
    })),
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PW_CHANNEL || "chrome",
  });

  const routes = [...PUBLIC, ...ADMIN, ...TRADER];
  const matrix = [];
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      for (const route of routes) {
        matrix.push({
          route,
          locale,
          width,
          url: routeUrl(route, locale),
        });
      }
    }
  }

  const results = [];
  let failed = false;

  const context = await browser.newContext();
  const page = await context.newPage();

  for (const entry of matrix) {
    try {
      const row = await runAxeOnPage(page, entry);
      results.push(row);
      if (row.failed) {
        failed = true;
        console.error(
          `[d1-axe] FAIL ${entry.route} ${entry.locale} ${entry.width}: ${row.seriousOrCritical.length} serious/critical`
        );
      }
    } catch (e) {
      failed = true;
      results.push({
        ...entry,
        error: e instanceof Error ? e.message : String(e),
        failed: true,
      });
      console.error(`[d1-axe] error ${entry.url}:`, e.message);
    }
  }

  await context.close();
  await browser.close();

  const out = {
    at: new Date().toISOString(),
    base: BASE,
    gate: "critical|serious → exit 1",
    widths: WIDTHS,
    locales: LOCALES,
    routeCount: routes.length,
    pageCount: matrix.length,
    failed,
    results,
  };

  fs.writeFileSync(path.join(OUT_DIR, "AXE-RESULTS.json"), JSON.stringify(out, null, 2));
  const badCount = results.filter((r) => r.failed).length;
  console.log(`[d1-axe] ${results.length} scans → AXE-RESULTS.json (${badCount} failed)`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
