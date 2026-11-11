/**
 * Capture WA-W2 evidence screenshots from /dev/wa-w2-evidence.
 * Light + dark for each frame.
 * Expects Next at PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/ui/wa-w2/shots");
const BASE = (process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

const FRAMES = [
  "menu",
  "attach",
  "preview",
  "voice",
  "incoming",
  "quick",
  "search",
  "emoji",
] as const;

const THEMES = ["light", "dark"] as const;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || "chrome",
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  await page.goto(`${BASE}/dev/wa-w2-evidence`, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await page.locator("[data-frame]").waitFor({ timeout: 20_000 });

  for (const theme of THEMES) {
    await page.evaluate((t) => {
      (
        window as unknown as { __waW2SetTheme?: (x: string) => void }
      ).__waW2SetTheme?.(t);
    }, theme);
    await page.waitForTimeout(200);

    for (const frame of FRAMES) {
      await page.evaluate((f) => {
        (
          window as unknown as { __waW2SetFrame?: (x: string) => void }
        ).__waW2SetFrame?.(f);
      }, frame);
      await page.waitForTimeout(280);
      const file = path.join(OUT, `frame-${theme}-${frame}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log("wrote", path.relative(ROOT, file));
    }
  }

  await browser.close();
  console.log(
    "[wa-w2-evidence] OK",
    THEMES.length * FRAMES.length,
    "shots (light+dark)"
  );
}

main().catch((err) => {
  console.error("[wa-w2-evidence] FAIL", err);
  process.exit(1);
});
