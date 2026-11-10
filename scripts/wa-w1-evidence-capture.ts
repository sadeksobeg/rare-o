/**
 * Capture real WA-W1 evidence screenshots from the dev harness
 * (simulated worker, no real WhatsApp send).
 *
 * Expects Next at PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000).
 * Writes docs/ui/wa-w1/shots/*.png
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/ui/wa-w1/shots");
const BASE = (process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

const FRAMES = [
  "sending",
  "sent",
  "delivered",
  "failed",
  "kill",
] as const;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: process.env.PW_CHANNEL || "chrome",
  });
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const url = `${BASE}/dev/wa-w1-evidence`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.locator("[data-frame]").waitFor({ timeout: 20_000 });

  for (const frame of FRAMES) {
    await page.evaluate((f) => {
      const w = window as unknown as { __waW1SetFrame?: (x: string) => void };
      w.__waW1SetFrame?.(f);
    }, frame);
    await page.waitForTimeout(250);
    const file = path.join(OUT, `frame-${frame}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log("wrote", path.relative(ROOT, file));
  }

  await browser.close();
  console.log("[wa-w1-evidence] OK", FRAMES.length, "shots");
}

main().catch((err) => {
  console.error("[wa-w1-evidence] FAIL", err);
  process.exit(1);
});
