/**
 * Round 2.1 — Lighthouse for the authenticated admin dashboard (owner item
 * 5). No existing Lighthouse script covers an authenticated route — this
 * logs in via Playwright for a real session cookie, then hands Lighthouse
 * that cookie via extraHeaders so it audits the actual AD-02 page, not the
 * login screen.
 *
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/pilot-r2-lighthouse.mjs
 * Output: docs/ui/pilot-r2/LIGHTHOUSE.json
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
const OUT_DIR = path.join(ROOT, "docs", "ui", "pilot-r2");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const RUNS = 2;

async function getSessionCookieHeader() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^دخول$/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
  const cookies = await page.context().cookies();
  await browser.close();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function runOnce(url, cookieHeader) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility"],
      formFactor: "desktop",
      screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
      extraHeaders: { Cookie: cookieHeader },
    });
    const lhr = result?.lhr;
    if (!lhr) throw new Error("No Lighthouse result");
    const opportunities = (lhr.audits ? Object.values(lhr.audits) : [])
      .filter((a) => a.details?.type === "opportunity" && a.score != null && a.score < 1)
      .sort((a, b) => (b.numericValue ?? 0) - (a.numericValue ?? 0))
      .slice(0, 6)
      .map((a) => ({ id: a.id, title: a.title, score: a.score, savingsMs: a.numericValue ?? null }));
    const a11yIssues = (lhr.audits ? Object.values(lhr.audits) : [])
      .filter((a) => lhr.categories.accessibility?.auditRefs?.some((r) => r.id === a.id) && a.score != null && a.score < 1)
      .map((a) => ({ id: a.id, title: a.title, score: a.score }));
    return {
      performance: lhr.categories.performance?.score ?? 0,
      accessibility: lhr.categories.accessibility?.score ?? 0,
      finalUrl: lhr.finalUrl,
      opportunities,
      a11yIssues,
    };
  } finally {
    try {
      await chrome.kill();
    } catch {}
  }
}

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL/ADMIN_PASSWORD in env.");
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cookieHeader = await getSessionCookieHeader();
  console.log("[lh] authenticated session acquired");

  const url = `${BASE}/admin`;
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    console.log(`[lh] run ${i + 1}/${RUNS}`);
    runs.push({ ...(await runOnce(url, cookieHeader)), run: i + 1 });
  }
  const perf = median(runs.map((r) => r.performance));
  const a11y = median(runs.map((r) => r.accessibility));

  const out = {
    at: new Date().toISOString(),
    url,
    runsPerRoute: RUNS,
    desktop: { width: 1440, height: 900 },
    median: { performance: perf, accessibility: a11y },
    runs,
    note: "Authenticated via a real admin login session (Playwright cookie passed to Lighthouse via extraHeaders).",
  };

  fs.writeFileSync(path.join(OUT_DIR, "LIGHTHOUSE.json"), JSON.stringify(out, null, 2));
  console.log(
    `[lh] median performance=${(perf * 100).toFixed(0)} accessibility=${(a11y * 100).toFixed(0)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
