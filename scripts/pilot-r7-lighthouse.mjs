import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const chromeLauncher = require("chrome-launcher");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r7");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

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
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${BASE}${loginPath}`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /دخول|Sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });
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
      onlyCategories: ["performance", "accessibility"],
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
    return {
      url,
      performance: lhr?.categories?.performance?.score ?? null,
      accessibility: lhr?.categories?.accessibility?.score ?? null,
      finalUrl: lhr?.finalUrl,
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
  admin: await runOnce(`${BASE}/admin`, adminCookie),
  trader: await runOnce(`${BASE}/trader`, traderCookie),
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "lighthouse.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
