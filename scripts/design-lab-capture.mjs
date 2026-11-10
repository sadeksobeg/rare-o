// Checkpoint-3 follow-up item 6: records a video of every design-lab
// screen (load -> scroll -> a real interaction), proves
// prefers-reduced-motion live via page.emulateMedia, and runs axe-core —
// at 375 and 1440, in both Arabic and English. Modeled on the same
// pattern as scripts/wave1-capture.mjs (that script's own two-pass
// structure: a recorded-video pass and a separate reduced-motion/axe
// pass), extended with a locale dimension via localStorage.
//
// Run with: node scripts/design-lab-capture.mjs
// Requires: the design-lab dev server running at http://localhost:3101
// (preview_start name "design-lab", or `npm --prefix design-lab run dev`).
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3101";
const OUT = "docs/ui-planning/design-lab-capture";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "videos"), { recursive: true });
fs.mkdirSync(path.join(OUT, "reduced-motion"), { recursive: true });

const axeSource = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const viewports = [
  { label: "375", width: 375, height: 812 },
  { label: "1440", width: 1440, height: 900 },
];
const locales = ["ar", "en"];

const pages = [
  {
    name: "login",
    url: "/login",
    interact: async (page) => {
      await page.getByRole("tab", { name: /تاجر|Trader/ }).click();
      await page.waitForTimeout(400);
      await page.getByLabel(/إظهار كلمة المرور|Show password/).click();
      await page.waitForTimeout(400);
    },
  },
  {
    name: "admin-dashboard",
    url: "/admin",
    interact: async (page) => {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(500);
    },
  },
  {
    name: "admin-traders",
    url: "/admin/traders",
    interact: async (page) => {
      // The owner's explicit requirement: exercise the reset-password flow.
      await page.getByRole("button", { name: /المزيد|More/ }).first().click();
      await page.waitForTimeout(300);
      await page.getByRole("menuitem", { name: /إعادة تعيين كلمة المرور|Reset Password/ }).click();
      await page.waitForTimeout(400);
      await page.getByRole("button", { name: /إعادة التعيين|Reset Password/ }).click();
      await page.waitForTimeout(500);
    },
  },
  {
    name: "admin-team",
    url: "/admin/team",
    interact: async (page) => {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(400);
    },
  },
  {
    name: "admin-customers",
    url: "/admin/customers",
    interact: async (page) => {
      await page.getByRole("row").nth(1).click();
      await page.waitForTimeout(500);
    },
  },
  {
    name: "admin-audit-log",
    url: "/admin/audit-log",
    interact: async (page) => {
      await page.getByPlaceholder(/ابحث|Search/).fill("سامر");
      await page.waitForTimeout(400);
    },
  },
  {
    name: "admin-profile",
    url: "/admin/profile",
    interact: async (page) => {
      await page.getByRole("tab", { name: /الأمان|Security/ }).click();
      await page.waitForTimeout(400);
    },
  },
  {
    name: "force-password-change",
    url: "/force-password-change",
    interact: async (page) => {
      await page.getByLabel(/كلمة المرور الجديدة|New Password/).fill("Example-Strong-9x");
      await page.waitForTimeout(500);
    },
  },
  {
    name: "trader-home",
    url: "/trader",
    interact: async (page) => {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(500);
    },
  },
  {
    name: "storefront-home",
    url: "/",
    interact: async (page) => {
      // 3D logo rotates continuously; hold here long enough to see it
      // turn through a visibly different angle without clipping.
      await page.waitForTimeout(3000);
      await page.mouse.wheel(0, 1600);
      await page.waitForTimeout(600);
    },
  },
];

const results = {};

const browser = await chromium.launch();

async function setLocale(context, locale) {
  await context.addInitScript((l) => {
    try {
      localStorage.setItem("ro-locale", l);
    } catch {}
  }, locale);
}

for (const p of pages) {
  results[p.name] = {};
  for (const vp of viewports) {
    for (const locale of locales) {
      const key = `${vp.label}-${locale}`;
      console.log(`=== ${p.name} @ ${key} ===`);
      results[p.name][key] = {};

      // ---- 1. video: load, scroll, interact ----
      {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          recordVideo: { dir: path.join(OUT, "videos"), size: { width: vp.width, height: vp.height } },
        });
        await setLocale(context, locale);
        const page = await context.newPage();
        await page.goto(BASE + p.url, { waitUntil: "networkidle" });
        await page.waitForTimeout(1200);
        try {
          await p.interact(page);
        } catch (e) {
          results[p.name][key].interactError = String(e).slice(0, 300);
        }
        await page.waitForTimeout(500);
        await context.close();
      }

      // ---- 2. reduced-motion: live emulation, screenshot proof ----
      {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
        await setLocale(context, locale);
        const page = await context.newPage();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(BASE + p.url, { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        const matches = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        results[p.name][key].reducedMotionMatches = matches;
        await page.screenshot({ path: path.join(OUT, "reduced-motion", `${p.name}-${key}.png`), fullPage: false });
        await context.close();
      }

      // ---- 3. axe-core x3 + overflow ----
      {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        await setLocale(context, locale);
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
        results[p.name][key].axe = runs;
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        results[p.name][key].overflow = overflow;
        await context.close();
      }

      console.log(JSON.stringify(results[p.name][key], null, 2));
    }
  }
}

await browser.close();

fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log("\nAll results written to " + path.join(OUT, "results.json"));
