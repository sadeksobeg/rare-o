import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r5");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (
      !(k in process.env) ||
      !process.env[k] ||
      k.startsWith("ADMIN_") ||
      k === "DATABASE_URL"
    ) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(() => {
  const r =
    document.querySelector('[data-portal="admin"]') || document.documentElement;
  r.setAttribute("data-theme", "light");
  r.classList.add("light");
});
await hideNextDevIndicator(page);
await page.waitForTimeout(600);

const probe = await page.evaluate(() => {
  const sin = document.querySelector(".rad-sin");
  const inp = document.querySelector(".rad-sin input");
  const ready = [...document.querySelectorAll(".rad-seg-scroll button")].find(
    (b) => (b.textContent || "").includes("جاهز")
  );
  const scroll = document.querySelector(".rad-seg-scroll");
  return {
    h1: document.querySelector("h1")?.textContent,
    bodyLen: (document.body?.innerText || "").length,
    sinBg: sin ? getComputedStyle(sin).backgroundColor : null,
    inpBg: inp ? getComputedStyle(inp).backgroundColor : null,
    readyText: ready?.textContent?.trim(),
    readyWS: ready ? getComputedStyle(ready).whiteSpace : null,
    readyH: ready ? Math.round(ready.getBoundingClientRect().height) : null,
    scrollW: scroll?.scrollWidth,
    clientW: scroll?.clientWidth,
  };
});
console.log(JSON.stringify(probe, null, 2));
await page.screenshot({
  path: path.join(OUT, "r5-requests-light-390-ar.png"),
  fullPage: false,
});
await browser.close();
