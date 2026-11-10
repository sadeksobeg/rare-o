import { chromium } from "@playwright/test";
import fs from "node:fs";

for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_")) process.env[k] = v;
}

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL || "chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.locator("#email").fill(process.env.ADMIN_EMAIL);
await page.locator("#password").fill(process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const entries = performance.getEntriesByType("resource");
  const fonts = entries.filter(
    (e) => e.initiatorType === "css" || /\.woff2?/i.test(e.name) || e.name.includes("font")
  );
  const paints = performance.getEntriesByType("paint");
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    paints: paints.map((p) => ({ name: p.name, t: Math.round(p.startTime) })),
    nav: nav
      ? {
          dcl: Math.round(nav.domContentLoadedEventEnd),
          load: Math.round(nav.loadEventEnd),
          ttfb: Math.round(nav.responseStart),
        }
      : null,
    fontCount: fonts.length,
    fontNames: fonts.slice(0, 20).map((f) => f.name.split("/").pop()),
    scripts: entries
      .filter((e) => e.initiatorType === "script")
      .map((e) => ({
        name: e.name.split("/").pop(),
        dur: Math.round(e.duration),
        size: e.transferSize,
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 15),
    img: entries
      .filter((e) => e.initiatorType === "img")
      .map((e) => ({ name: e.name.split("/").pop(), size: e.transferSize, dur: Math.round(e.duration) })),
  };
});
fs.mkdirSync("docs/ui/pilot-final", { recursive: true });
fs.writeFileSync("docs/ui/pilot-final/lcp-probe2.json", JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2));
await browser.close();
