/**
 * Round 5 start — requests carry shots (1440 dark/light + 390) with N hidden.
 */
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

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') ||
      document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, theme);
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });

const shots = [];
for (const [w, h, tag] of [
  [1440, 900, "1440"],
  [390, 844, "390"],
]) {
  await page.setViewportSize({ width: w, height: h });
  for (const theme of tag === "390" ? ["dark", "light"] : ["dark", "light"]) {
    await page.goto(`${BASE}/admin/requests`, { waitUntil: "networkidle" });
    await setTheme(page, theme);
    await hideNextDevIndicator(page);
    await page.waitForTimeout(350);
    const metrics = await page.evaluate(() => {
      const search = document.querySelector(".rad-sin input");
      const bg = search ? getComputedStyle(search).backgroundColor : null;
      const wrapBg = search?.closest(".rad-sin")
        ? getComputedStyle(search.closest(".rad-sin")).backgroundColor
        : null;
      const surface2 = getComputedStyle(
        document.querySelector('[data-portal="admin"]') || document.documentElement
      ).getPropertyValue("--rad-surface2").trim();
      const tabs = [...document.querySelectorAll(".rad-seg-scroll button")].map(
        (b) => ({
          text: b.textContent?.trim(),
          wrap: getComputedStyle(b).whiteSpace,
          h: Math.round(b.getBoundingClientRect().height),
        })
      );
      const phone = document.querySelector(".rad-who bdi")?.textContent?.trim();
      const toggle = document.querySelector(".rad-view-toggle")?.textContent?.trim();
      return { bg, wrapBg, surface2, tabs: tabs.slice(0, 4), phone, toggle };
    });
    const name = `r5-requests-${theme}-${tag}-ar.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    shots.push({ name, metrics });
  }
}

fs.writeFileSync(
  path.join(OUT, "requests-carry-metrics.json"),
  JSON.stringify(shots, null, 2)
);
console.log(JSON.stringify(shots, null, 2));
await browser.close();
