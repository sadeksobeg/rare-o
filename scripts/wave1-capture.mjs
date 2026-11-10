// Wave 1 checkpoint 2 verification: records a short video of each signature
// screen (load -> scroll -> one interaction), proves prefers-reduced-motion
// live via page.emulateMedia, and runs axe-core. Run with:
//   node scripts/wave1-capture.mjs
// Requires: `npx serve -l 4600 docs/ui/design/mockups` running separately.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:4600";
const OUT = "docs/ui-planning/wave1-capture";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "videos"), { recursive: true });
fs.mkdirSync(path.join(OUT, "reduced-motion"), { recursive: true });

const axeSource = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const pages = [
  { name: "login", url: "/login.html", interact: async (page) => {
      await page.getByRole("tab", { name: /تاجر/ }).click();
      await page.waitForTimeout(400);
    } },
  { name: "admin-dashboard", url: "/admin-dashboard.html", interact: async (page) => {
      await page.keyboard.press("Control+k");
      await page.waitForTimeout(400);
      await page.keyboard.press("Escape");
    } },
  { name: "trader-home", url: "/trader-home.html", interact: async (page) => {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(300);
    } },
  { name: "storefront-home", url: "/storefront-home.html", interact: async (page) => {
      await page.mouse.wheel(0, 1600);
      await page.waitForTimeout(600);
    } },
];

const results = {};

const browser = await chromium.launch({
  executablePath: "C:/Users/ASUS/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe",
});

for (const p of pages) {
  console.log("=== " + p.name + " ===");
  results[p.name] = {};

  // ---- 1. video: load, scroll, interact ----
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: path.join(OUT, "videos"), size: { width: 1440, height: 900 } },
    });
    const page = await context.newPage();
    await page.goto(BASE + p.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(600);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(600);
    await p.interact(page);
    await page.waitForTimeout(500);
    await context.close();
    const videoPath = await page.video().path().catch(() => null);
  }

  // ---- 2. reduced-motion: live emulation, screenshot proof ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(BASE + p.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const matches = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    results[p.name].reducedMotionMatches = matches;
    await page.screenshot({ path: path.join(OUT, "reduced-motion", p.name + ".png"), fullPage: false });
    await context.close();
  }

  // ---- 3. axe-core, x3 ----
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(BASE + p.url, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axeSource });
    await page.waitForFunction(() => document.fonts.ready);
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const r = await page.evaluate(async () => {
        const res = await axe.run();
        return res.violations.map((v) => ({ id: v.id, nodes: v.nodes.length }));
      });
      runs.push(r);
    }
    results[p.name].axe = runs;

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    results[p.name].overflowDesktop = overflow;
    await context.close();

    // mobile overflow check
    const mctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const mpage = await mctx.newPage();
    await mpage.goto(BASE + p.url, { waitUntil: "networkidle" });
    await mpage.waitForTimeout(500);
    const overflowMobile = await mpage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    results[p.name].overflowMobile = overflowMobile;
    await mctx.close();
  }

  console.log(JSON.stringify(results[p.name], null, 2));
}

await browser.close();

fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log("\nAll results written to " + path.join(OUT, "results.json"));
