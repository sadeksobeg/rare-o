import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3001";
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_")) process.env[k] = v;
}

const browser = await chromium.launch({
  headless: true,
  executablePath: chromium.executablePath(),
});
const page = await browser.newPage();
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.locator("#email").fill(process.env.ADMIN_EMAIL);
await page.locator("#password").fill(process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 90000 });

const report = await page.evaluate(async () => {
  const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
  const last = lcpEntries[lcpEntries.length - 1];
  const paint = performance.getEntriesByType("paint").map((p) => ({
    name: p.name,
    startTime: p.startTime,
  }));
  const nav = performance.getEntriesByType("navigation")[0];
  const resources = performance
    .getEntriesByType("resource")
    .map((r) => ({
      name: r.name.replace(/^https?:\/\/[^/]+/, "").slice(0, 120),
      type: r.initiatorType,
      dur: Math.round(r.duration),
      size: r.transferSize || 0,
      start: Math.round(r.startTime),
    }))
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 20);

  // Find likely LCP node via size
  let lcpHint = null;
  if (last) {
    lcpHint = {
      time: last.startTime,
      size: last.size,
      url: last.url || null,
      id: last.id || null,
      element: last.element
        ? {
            tag: last.element.tagName,
            class: String(last.element.className || "").slice(0, 160),
            text: (last.element.innerText || "").slice(0, 100),
          }
        : null,
    };
  }

  const imgs = [...document.images].slice(0, 20).map((img) => ({
    src: (img.currentSrc || img.src || "").replace(/^https?:\/\/[^/]+/, "").slice(0, 100),
    w: img.naturalWidth,
    h: img.naturalHeight,
    attrW: img.getAttribute("width"),
    attrH: img.getAttribute("height"),
    complete: img.complete,
  }));

  const cssVars = getComputedStyle(document.documentElement);
  return {
    lcpHint,
    paint,
    nav: nav
      ? {
          domContentLoaded: nav.domContentLoadedEventEnd,
          load: nav.loadEventEnd,
          responseStart: nav.responseStart,
          transferSize: nav.transferSize,
        }
      : null,
    resources,
    imgs,
    fontCount: document.fonts ? document.fonts.size : null,
  };
});

fs.mkdirSync("docs/ui/pilot-final", { recursive: true });
fs.writeFileSync("docs/ui/pilot-final/lcp-probe.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
