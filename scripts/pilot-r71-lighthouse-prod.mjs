/**
 * Lighthouse against production server (next start), not next dev.
 * Expects PLAYWRIGHT_BASE_URL pointing at the prod server (default :3001).
 */
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const chromeLauncher = require("chrome-launcher");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r71");
const PROD_PORT = process.env.R71_LH_PORT || "3001";
const BASE = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PROD_PORT}`;

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

async function waitReady(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url, { redirect: "manual" });
      if (r.status > 0) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
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

console.log("Building…");
const build = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "build"],
  { cwd: ROOT, stdio: "inherit", env: process.env, shell: true }
);
await new Promise((resolve, reject) => {
  build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`build ${code}`))));
});

console.log("Starting next start on", PROD_PORT);
const server = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "-p", PROD_PORT],
  { cwd: ROOT, stdio: "pipe", env: process.env, shell: true }
);
const ok = await waitReady(`${BASE}/admin/login`);
if (!ok) {
  server.kill();
  throw new Error("prod server did not become ready");
}

try {
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
    mode: "next start",
    base: BASE,
    admin: await runOnce(`${BASE}/admin`, adminCookie),
    trader: await runOnce(`${BASE}/trader`, traderCookie),
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "lighthouse.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  server.kill();
}
