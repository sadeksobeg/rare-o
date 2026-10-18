/**
 * C6 — axe + Lighthouse on key routes (mobile).
 *
 * Requires: PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000)
 * Uses Playwright channel chrome + chrome-launcher for Lighthouse.
 *
 * Thresholds (exit 1 when violated):
 * - axe: any violation with impact "critical" or "serious"
 * - Lighthouse (performance, accessibility): score < 0.85 on Home or Catalog
 *
 * Outputs:
 * - docs/pro-readiness/AXE-RESULTS.json
 * - docs/pro-readiness/LIGHTHOUSE.json
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import lighthouse from "lighthouse";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const chromeLauncher = require("chrome-launcher");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "pro-readiness");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const LH_THRESHOLD = 0.85;

const envPath = path.join(ROOT, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}

const AXE_ROUTES = [
  { path: "/", locale: "ar" },
  { path: "/catalog", locale: "ar" },
  { path: "/cart", locale: "ar" },
  { path: "/request", locale: "ar" },
  { path: "/admin/login", locale: "en" },
  { path: "/trader/login", locale: "en" },
];

const LH_ROUTES = [
  { name: "home", path: "/", locale: "ar" },
  { name: "catalog", path: "/catalog", locale: "ar" },
  { name: "product", path: "/catalog", locale: "ar", note: "catalog proxy if no product URL" },
  { name: "request", path: "/request", locale: "ar" },
  { name: "admin_login", path: "/admin/login", locale: "en" },
  { name: "trader_login", path: "/trader/login", locale: "en" },
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

async function runAxe(page) {
  const axeResults = [];
  let failed = false;

  for (const { path: routePath, locale } of AXE_ROUTES) {
    const url = routeUrl(routePath, locale);
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    const analysis = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const bad = analysis.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact)
    );
    if (bad.length) failed = true;

    axeResults.push({
      url,
      status: res?.status() ?? 0,
      violationCount: analysis.violations.length,
      seriousOrCritical: bad.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
      })),
    });
  }

  return { axeResults, failed };
}

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility"],
      formFactor: "mobile",
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        disabled: false,
      },
    });
    const lhr = result?.lhr;
    if (!lhr) throw new Error("No Lighthouse result");
    const perf = lhr.categories.performance?.score ?? 0;
    const a11y = lhr.categories.accessibility?.score ?? 0;
    return {
      url,
      performance: perf,
      accessibility: a11y,
      fetchTime: lhr.fetchTime,
    };
  } finally {
    await chrome.kill();
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || "chrome",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  let exitCode = 0;
  const axeOut = { base: BASE, threshold: "critical|serious → fail", routes: [] };
  const lhOut = {
    base: BASE,
    threshold: LH_THRESHOLD,
    mobile: { width: 390, height: 844 },
    note: "Run against `next start` (production) for perf thresholds; next dev is expected to score lower.",
    routes: [],
  };

  try {
    const { axeResults, failed: axeFailed } = await runAxe(page);
    axeOut.routes = axeResults;
    if (axeFailed) {
      console.error("[c6] axe: critical/serious violations found");
      exitCode = 1;
    } else {
      console.log("[c6] axe: 0 critical/serious");
    }
  } catch (e) {
    console.error("[c6] axe run failed:", e.message);
    exitCode = 1;
    axeOut.error = e.message;
  } finally {
    await context.close();
    await browser.close();
  }

  // Primary LH gates: home + catalog only (plan). Extra routes recorded for proof.
  const gated = new Set(["home", "catalog"]);
  for (const route of LH_ROUTES) {
    const url = routeUrl(route.path, route.locale);
    try {
      const result = await runLighthouse(url);
      lhOut.routes.push({ ...route, ...result });
      if (
        gated.has(route.name) &&
        (result.performance < LH_THRESHOLD ||
          result.accessibility < LH_THRESHOLD)
      ) {
        console.error(
          `[c6] lighthouse ${route.name}: perf=${result.performance} a11y=${result.accessibility} (< ${LH_THRESHOLD})`
        );
        exitCode = 1;
      } else {
        console.log(
          `[c6] lighthouse ${route.name}: perf=${result.performance} a11y=${result.accessibility}`
        );
      }
    } catch (e) {
      lhOut.routes.push({ ...route, url, error: e.message });
      console.error(`[c6] lighthouse ${route.name} failed:`, e.message);
      if (gated.has(route.name)) exitCode = 1;
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "AXE-RESULTS.json"),
    JSON.stringify(axeOut, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "LIGHTHOUSE.json"),
    JSON.stringify(lhOut, null, 2)
  );

  console.log("[c6] wrote docs/pro-readiness/AXE-RESULTS.json");
  console.log("[c6] wrote docs/pro-readiness/LIGHTHOUSE.json");
  process.exit(exitCode);
}

main();
