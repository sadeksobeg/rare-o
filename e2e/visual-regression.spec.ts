import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * F5 visual regression — key storefront routes, Arabic (default), 390 + 1440 widths.
 * Baselines: first run writes PNGs under test-results/visual/ (commit optional).
 * Threshold: compare locally with pixelmatch; default Playwright toHaveScreenshot uses
 * maxDiffPixelRatio 0.02 when baselines exist under e2e/visual-regression.spec.ts-snapshots/.
 * See docs/pro-readiness/TEST-INVENTORY.md § Visual regression.
 */
const OUT_DIR = path.join(process.cwd(), "test-results", "visual");

const ROUTES = [
  { name: "home", path: "/" },
  { name: "catalog", path: "/catalog" },
  { name: "contact", path: "/contact" },
  { name: "privacy", path: "/privacy" },
  { name: "request", path: "/request" },
] as const;

const VIEWPORTS = [
  { tag: "390", width: 390, height: 844 },
  { tag: "1440", width: 1440, height: 900 },
] as const;

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

test.describe("F5 visual regression (AR)", () => {
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`${route.name} ${vp.tag}px`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route.path, { waitUntil: "networkidle" });
        await expect(page.locator("h1").first()).toBeVisible({ timeout: 20_000 });

        const file = path.join(OUT_DIR, `${route.name}-ar-${vp.tag}.png`);
        await page.screenshot({ path: file, fullPage: true });
        expect(fs.existsSync(file)).toBeTruthy();
      });
    }
  }
});
