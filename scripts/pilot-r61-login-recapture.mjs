import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  locale: "ar",
});
await page.addInitScript(() => localStorage.setItem("ro-portal-theme-v5", "dark"));

async function shot(name) {
  await hideNextDevIndicator(page);
  const h = await page.evaluate(() =>
    Math.min(
      16000,
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        900
      )
    )
  );
  const w = page.viewportSize()?.width || 1440;
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log("wrote", name);
}

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await shot("r61-login-dark-1440-ar.png");
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
await shot("r61-login-dark-390-ar.png");

for (const st of ["error", "lock", "2fa", "recovery"]) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/dev/auth-states?state=${st}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await shot(`r61-auth-${st}-dark-1440-ar.png`);
}

await browser.close();
