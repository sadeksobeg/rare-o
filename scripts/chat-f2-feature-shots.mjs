/**
 * CHAT-F2 feature shots (fake local data). Requires seed first:
 *   npx tsx scripts/chat-f2-seed-shots.ts
 *   node scripts/chat-f2-feature-shots.mjs
 *
 * a) admin 1440 merged thread
 * b) trader 1440 same merged thread
 * c) empty-phone: no auto-link (admin list + thread)
 * d) trader 390 composer above tab bar
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/chat/shots/f2");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env) || !process.env[key]) process.env[key] = v;
  }
}
loadDotEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";

function seed() {
  const r = spawnSync("npx", ["tsx", "scripts/chat-f2-seed-shots.ts"], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error("seed failed");
  }
  const line = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean).pop();
  return JSON.parse(line);
}

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 20000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 4 });
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', ADMIN_EMAIL);
  await setVal(page, 'input[name="password"]', ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

async function loginTrader(page) {
  await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', TRADER_EMAIL);
  await setVal(page, 'input[name="password"]', TRADER_PASSWORD);
  await Promise.all([
    page.waitForURL(
      (u) => u.pathname.startsWith("/trader") && !u.pathname.includes("/login"),
      { timeout: 30000 }
    ),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

async function hideDevOverlays(page) {
  await page
    .addStyleTag({
      content: `
      nextjs-portal, [data-nextjs-toast], [data-next-badge], #__next-build-watcher,
      [data-nextjs-dialog-overlay], [data-nextjs-dev-overlay] { display: none !important; }
    `,
    })
    .catch(() => {});
}

async function seeLine(page, selectors) {
  const bits = [];
  for (const sel of selectors) {
    const n = await page.locator(sel).count();
    bits.push(`${sel}=${n}`);
  }
  const body = await page.locator("body").innerText().catch(() => "");
  const hasWa = /واتساب|WhatsApp|F2-WA/i.test(body);
  const hasPlat = /المنصة|platform|F2-PLAT/i.test(body);
  return { counts: bits.join(", "), hasWa, hasPlat, sample: body.slice(0, 280).replace(/\s+/g, " ") };
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL/PASSWORD required");
  fs.mkdirSync(OUT, { recursive: true });
  const seeded = seed();
  console.log("seed", seeded);

  const browser = await chromium.launch({ headless: true });
  const notes = [];

  async function shot(page, name, see) {
    await hideDevOverlays(page);
    const file = path.join(OUT, name);
    await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
    notes.push({ file: name, see });
    console.log(`SEE ${name}: ${see}`);
  }

  try {
    // a) admin merged @1440
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: "ar-SA",
        colorScheme: "dark",
      });
      const page = await ctx.newPage();
      await loginAdmin(page);
      await page.goto(`${BASE}/admin/inbox/${seeded.mergedConversationId}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForSelector(".rad-ct .rad-msgs", { timeout: 30000 });
      await page.waitForTimeout(800);
      await page.evaluate(() => {
        const msgs = document.querySelector(".rad-ct > .rad-msgs");
        if (msgs) msgs.scrollTop = 0;
      });
      await page.waitForTimeout(200);
      const probe = await seeLine(page, [
        ".rad-chchip-wa",
        ".rad-chchip-plat",
        ".rad-bb",
        ".rad-bbl",
      ]);
      await shot(
        page,
        "f2-merged-admin-1440.png",
        `Admin merged thread @1440: both channel chips/messages visible (wa=${probe.hasWa} plat=${probe.hasPlat}; ${probe.counts}). SEE: one Demo Trader thread with F2-WA + F2-PLAT bodies in order after unify.`
      );
      if (!probe.hasWa || !probe.hasPlat) {
        throw new Error(`admin shot missing channel content: ${JSON.stringify(probe)}`);
      }
      await ctx.close();
    }

    // b) trader merged @1440
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: "ar-SA",
        colorScheme: "dark",
      });
      const page = await ctx.newPage();
      await loginTrader(page);
      await page.goto(`${BASE}/trader/messages`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(1000);
      const probe = await seeLine(page, ["article", "[data-channel]"]);
      await shot(
        page,
        "f2-merged-trader-1440.png",
        `Trader /messages @1440 same merged thread: SEE platform + WhatsApp bodies (wa=${probe.hasWa} plat=${probe.hasPlat}).`
      );
      if (!probe.hasWa || !probe.hasPlat) {
        throw new Error(`trader 1440 missing channels: ${JSON.stringify(probe)}`);
      }
      await ctx.close();
    }

    // c) empty-phone: admin list + empty platform thread + orphan LID separate
    {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: "ar-SA",
        colorScheme: "dark",
      });
      const page = await ctx.newPage();
      await loginAdmin(page);
      await page.goto(`${BASE}/admin/inbox/${seeded.emptyPlatformConversationId}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForSelector(".rad-ct", { timeout: 30000 });
      await page.waitForTimeout(600);
      const body = await page.locator("body").innerText();
      const seesEmpty = /تاجر بلا هاتف|منصة فقط/i.test(body);
      await shot(
        page,
        "f2-empty-phone-admin-1440.png",
        `Empty-phone trader platform thread @1440: SEE «تاجر بلا هاتف» / platform-only message; orphan LID is a separate list row (not merged). seesEmpty=${seesEmpty}`
      );
      // Also open orphan LID to prove separate
      await page.goto(`${BASE}/admin/inbox/${seeded.emptyOrphanLidId}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(500);
      const orphanBody = await page.locator("body").innerText();
      const orphanOk = /بلا ربط|يبقى منفصلاً|LID/i.test(orphanBody);
      await shot(
        page,
        "f2-empty-phone-orphan-lid-1440.png",
        `Orphan LID (no traderId) @1440: SEE unlinked LID inbound still separate — no auto-link/merge. orphanOk=${orphanOk}`
      );
      if (!seesEmpty || !orphanOk) {
        throw new Error(`empty-phone shots weak: seesEmpty=${seesEmpty} orphanOk=${orphanOk}`);
      }
      await ctx.close();
    }

    // d) trader 390 composer above tab bar
    {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        locale: "ar-SA",
        colorScheme: "dark",
        isMobile: true,
        hasTouch: true,
      });
      const page = await ctx.newPage();
      await loginTrader(page);
      await page.goto(`${BASE}/trader/messages`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(1000);
      const geom = await page.evaluate(() => {
        const composer =
          document.querySelector("[data-trader-composer], form, textarea")?.closest("form") ||
          document.querySelector("textarea")?.parentElement;
        const tab =
          document.querySelector("nav[data-trader-tabs], [data-trader-bottom-nav], nav") ||
          [...document.querySelectorAll("nav, footer")].pop();
        const cr = composer?.getBoundingClientRect();
        const tr = tab?.getBoundingClientRect();
        return {
          composerBottom: cr ? Math.round(cr.bottom) : null,
          tabTop: tr ? Math.round(tr.top) : null,
          gap: cr && tr ? Math.round(tr.top - cr.bottom) : null,
        };
      });
      const probe = await seeLine(page, ["textarea", "article"]);
      await shot(
        page,
        "f2-merged-trader-390.png",
        `Trader merged @390: SEE composer above bottom tabs (gap=${geom.gap}); both channels in thread (wa=${probe.hasWa} plat=${probe.hasPlat}). geom=${JSON.stringify(geom)}`
      );
      if (geom.gap != null && geom.gap < -4) {
        throw new Error(`composer overlaps tab bar: ${JSON.stringify(geom)}`);
      }
      if (!probe.hasWa || !probe.hasPlat) {
        throw new Error(`trader 390 missing channels: ${JSON.stringify(probe)}`);
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  const notesPath = path.join(OUT, "FEATURE-NOTES.md");
  fs.writeFileSync(
    notesPath,
    notes.map((n) => `- **${n.file}:** ${n.see}`).join("\n") + "\n"
  );
  console.log("F2_FEATURE_SHOTS_DONE", notes.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
