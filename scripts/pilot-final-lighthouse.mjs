/**
 * Lighthouse against an already-running production server (next start).
 * Does NOT rebuild — set PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3001).
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
const OUT = path.join(ROOT, "docs/ui/pilot-final");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_") || k.startsWith("TRADER_")) {
    process.env[k] = v;
  }
}

async function cookieFor(loginPath, email, password) {
  // Full Chromium path — headless_shell may be absent on this machine.
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PW_CHANNEL || "chrome",
  });
  const page = await browser.newPage();
  await page.goto(`${BASE}${loginPath}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
  const cookies = await page.context().cookies();
  await browser.close();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function runOnce(url, cookieHeader) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      formFactor: "desktop",
      screenEmulation: {
        mobile: false,
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        disabled: false,
      },
      extraHeaders: { Cookie: cookieHeader },
    });
    const lhr = result?.lhr;
    const audits = lhr?.audits || {};
    const topOpportunities = Object.values(audits)
      .filter((a) => a?.details?.type === "opportunity" && (a.numericValue || 0) > 0)
      .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        title: a.title,
        score: a.score,
        displayValue: a.displayValue,
        numericValue: a.numericValue,
      }));
    return {
      url,
      performance: lhr?.categories?.performance?.score ?? null,
      accessibility: lhr?.categories?.accessibility?.score ?? null,
      bestPractices: lhr?.categories?.["best-practices"]?.score ?? null,
      seo: lhr?.categories?.seo?.score ?? null,
      finalUrl: lhr?.finalUrl,
      metrics: {
        LCP: audits["largest-contentful-paint"]?.numericValue ?? null,
        TBT: audits["total-blocking-time"]?.numericValue ?? null,
        CLS: audits["cumulative-layout-shift"]?.numericValue ?? null,
        FCP: audits["first-contentful-paint"]?.numericValue ?? null,
        SI: audits["speed-index"]?.numericValue ?? null,
      },
      topOpportunities,
    };
  } finally {
    try {
      await chrome.kill();
    } catch {
      /* ignore */
    }
  }
}

const adminCookie = await cookieFor(
  "/admin/login",
  process.env.ADMIN_EMAIL,
  process.env.ADMIN_PASSWORD
);
const traderCookie = await cookieFor(
  "/trader/login",
  process.env.TRADER_EMAIL || "trader@rareoud.local",
  process.env.TRADER_PASSWORD || "ChangeMeNow!"
);

const results = {
  at: new Date().toISOString(),
  mode: "next start (prebuilt)",
  base: BASE,
  admin: await runOnce(`${BASE}/admin`, adminCookie),
  trader: await runOnce(`${BASE}/trader`, traderCookie),
};
fs.writeFileSync(path.join(OUT, "lighthouse.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
