/**
 * Round 3 — axe specifically on an open conversation (/admin/inbox/[id]),
 * which the project's shared d1-axe-full.mjs sweep does not cover (by
 * existing convention it only scans list/index routes, not any [id] detail
 * page across the whole app — not special-cased for inbox). ar+en x
 * 390/1440, same critical|serious gate as d1-axe-full.mjs.
 *
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/pilot-r3-inbox-axe-thread.mjs
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Set ADMIN_EMAIL/ADMIN_PASSWORD");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^دخول$/ }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

  await page.goto(`${BASE}/admin/inbox`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  const firstRow = await page.$(".rad-cv");
  if (!firstRow) throw new Error("No conversation rows found to open");
  await firstRow.click();
  await page.waitForLoadState("networkidle");
  const convUrl = page.url();

  const results = [];
  for (const locale of ["ar", "en"]) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const url = locale === "ar" ? convUrl : `${convUrl}?lang=en`;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      const analysis = await new AxeBuilder({ page }).analyze();
      const bad = analysis.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      results.push({
        locale,
        width,
        url,
        violationCount: analysis.violations.length,
        seriousOrCritical: bad.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
      });
      console.log(`[axe-thread] ${locale} ${width}: ${bad.length} serious/critical`);
    }
  }
  await browser.close();
  fs.writeFileSync(
    path.join(ROOT, "docs", "ui", "pilot-r2", "INBOX-THREAD-AXE.json"),
    JSON.stringify({ at: new Date().toISOString(), convUrl, results }, null, 2)
  );
  const failed = results.some((r) => r.seriousOrCritical.length > 0);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
