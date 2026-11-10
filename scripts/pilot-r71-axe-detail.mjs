import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("TRADER_")) process.env[k] = v;
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "ar",
});
const page = await context.newPage();
await page.goto(`${BASE}/trader/login`, { waitUntil: "networkidle" });
await page.locator("#email").fill(process.env.TRADER_EMAIL || "trader@rareoud.local");
await page.locator("#password").fill(process.env.TRADER_PASSWORD || "ChangeMeNow!");
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"));

for (const route of ["/trader", "/trader/profile"]) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  for (const v of results.violations) {
    console.log(
      "\n",
      route,
      v.id,
      JSON.stringify(
        v.nodes.slice(0, 3).map((n) => ({
          html: n.html.slice(0, 200),
          target: n.target,
        })),
        null,
        2
      )
    );
  }
}
await browser.close();
