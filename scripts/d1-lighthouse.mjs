/**
 * D1 Lighthouse mobile — 3 runs each for Home, Catalog, Product (DB slug), Request.
 * Median performance + accessibility; gate >= 0.85.
 * Output: docs/pro-readiness/LIGHTHOUSE.json
 */
import { chromium } from "@playwright/test";
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
const THRESHOLD = 0.85;
const RUNS = 3;

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

function storefrontPath(routePath, locale) {
  if (routePath.startsWith("/admin") || routePath.startsWith("/trader")) {
    return routePath;
  }
  if (locale === "en") {
    return routePath === "/" ? "/en" : `/en${routePath}`;
  }
  return routePath;
}

function routeUrl(routePath, locale = "ar") {
  const p = storefrontPath(routePath, locale);
  const sep = p.includes("?") ? "&" : "?";
  return `${BASE}${p}${sep}lang=${locale}`;
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function resolveProductUrl() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const product = await prisma.product.findFirst({
      where: { status: "published" },
      orderBy: { updatedAt: "desc" },
      select: { slug: true },
    });
    if (product?.slug) {
      return routeUrl(`/product/${product.slug}`, "ar");
    }
  } finally {
    await prisma.$disconnect();
  }

  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || "chrome",
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.goto(routeUrl("/catalog", "ar"), {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const href = await page
      .locator('a[href*="/product/"]')
      .first()
      .getAttribute("href");
    if (href?.startsWith("http")) return href;
    if (href) return `${BASE}${href}${href.includes("?") ? "&" : "?"}lang=ar`;
  } finally {
    await browser.close();
  }
  return routeUrl("/catalog", "ar");
}

async function runLighthouseOnce(url) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
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
    const opportunities = (lhr.audits ? Object.values(lhr.audits) : [])
      .filter((a) => a.details?.type === "opportunity" && a.score != null && a.score < 1)
      .sort((a, b) => (b.numericValue ?? 0) - (a.numericValue ?? 0))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.title,
        score: a.score,
        savingsMs: a.numericValue ?? null,
      }));

    return {
      performance: lhr.categories.performance?.score ?? 0,
      accessibility: lhr.categories.accessibility?.score ?? 0,
      fetchTime: lhr.fetchTime,
      opportunities,
    };
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* ignore */
    }
  }
}

async function runLighthouseOnceRetried(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await runLighthouseOnce(url);
    } catch (e) {
      lastErr = e;
      console.warn(`[d1-lh] run attempt ${i + 1}/${attempts} failed:`, e.message);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw lastErr;
}

async function auditRoute(name, url) {
  // Discard one cold-cache warmup so median reflects steady `next start` performance.
  console.log(`[d1-lh] ${name} warmup`);
  try {
    await runLighthouseOnceRetried(url, 2);
  } catch (e) {
    console.warn(`[d1-lh] ${name} warmup skipped:`, e.message);
  }
  const runs = [];
  for (let i = 0; i < RUNS; i += 1) {
    console.log(`[d1-lh] ${name} run ${i + 1}/${RUNS}`);
    runs.push({ ...(await runLighthouseOnceRetried(url)), run: i + 1 });
  }
  const perf = median(runs.map((r) => r.performance));
  const a11y = median(runs.map((r) => r.accessibility));
  const oppMap = new Map();
  for (const r of runs) {
    for (const o of r.opportunities ?? []) {
      const prev = oppMap.get(o.id);
      if (!prev || (o.savingsMs ?? 0) > (prev.savingsMs ?? 0)) {
        oppMap.set(o.id, o);
      }
    }
  }
  const opportunities = [...oppMap.values()]
    .sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0))
    .slice(0, 5);

  return {
    name,
    url,
    runs,
    median: { performance: perf, accessibility: a11y },
    opportunities,
    passed: perf >= THRESHOLD && a11y >= THRESHOLD,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const productUrl = await resolveProductUrl();
  const targets = [
    { name: "home", url: routeUrl("/", "ar") },
    { name: "catalog", url: routeUrl("/catalog", "ar") },
    { name: "product", url: productUrl },
    { name: "request", url: routeUrl("/request", "ar") },
  ];

  let exitCode = 0;
  const routes = [];
  for (const t of targets) {
    try {
      const row = await auditRoute(t.name, t.url);
      routes.push(row);
      if (!row.passed) {
        exitCode = 1;
        console.error(
          `[d1-lh] FAIL ${t.name}: median perf=${row.median.performance} a11y=${row.median.accessibility}`
        );
      } else {
        console.log(
          `[d1-lh] OK ${t.name}: median perf=${row.median.performance} a11y=${row.median.accessibility}`
        );
      }
    } catch (e) {
      exitCode = 1;
      routes.push({ name: t.name, url: t.url, error: e.message, passed: false });
      console.error(`[d1-lh] ${t.name} failed:`, e.message);
    }
  }

  const out = {
    at: new Date().toISOString(),
    base: BASE,
    threshold: THRESHOLD,
    runsPerRoute: RUNS,
    mobile: { width: 390, height: 844 },
    note: "Prefer `next start` for stable performance scores.",
    routes,
    passed: routes.every((r) => r.passed),
  };

  fs.writeFileSync(path.join(OUT_DIR, "LIGHTHOUSE.json"), JSON.stringify(out, null, 2));
  console.log("[d1-lh] wrote docs/pro-readiness/LIGHTHOUSE.json");
  process.exit(exitCode);
}

main();
