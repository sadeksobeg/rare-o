/**
 * W-H polish evidence shots for WhatsApp closure.
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 node scripts/wa-closure-polish-shots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/wa-closure/shots");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const NOTES = [];

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_")) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') || document.documentElement;
    root.setAttribute("data-theme", t);
  }, theme);
}

async function shot(page, name, see) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  NOTES.push(`- **${name}:** ${see}`);
  console.log(`SHOT ${name}: ${see}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();
  await login(page);

  // empty inbox hint @1440
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/admin/inbox`, { waitUntil: "networkidle" });
  await setTheme(page, "dark");
  const hint = await page.locator(".rad-ept p").first().innerText().catch(() => "");
  await shot(
    page,
    "closure-inbox-empty-1440-dark.png",
    `Empty state hint text=${JSON.stringify(hint)} (expect J / K LTR order)`
  );
  await setTheme(page, "light");
  await shot(page, "closure-inbox-empty-1440-light.png", `Light empty inbox; hint=${JSON.stringify(hint)}`);

  // list with conversation @ widths
  const row = page.locator(".rad-cv a, a.rad-cv, .rad-lc a[href*='/admin/inbox/']").first();
  await row.waitFor({ timeout: 20000 });
  await row.click();
  await page.waitForURL(/\/admin\/inbox\/[^/]+/, { timeout: 20000 });
  await page.locator(".rad-th").waitFor({ timeout: 15000 });

  for (const [w, theme] of [
    [1440, "dark"],
    [1440, "light"],
    [1280, "dark"],
    [768, "dark"],
    [390, "dark"],
  ]) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
    await setTheme(page, theme);
    await page.waitForTimeout(400);
    await shot(
      page,
      `closure-thread-${theme}-${w}.png`,
      `Thread @${w} ${theme}; header badges wrap; banner above bubbles`
    );
  }

  // context drawer + close
  await page.setViewportSize({ width: 1440, height: 900 });
  await setTheme(page, "dark");
  const ctxBtn = page.locator(".rad-ctxbtn").first();
  if (await ctxBtn.count()) {
    await ctxBtn.click();
    await page.waitForTimeout(500);
    const closeVisible = await page.locator(".rad-xp-close").isVisible().catch(() => false);
    await shot(
      page,
      "closure-context-drawer-1440.png",
      `Context drawer open; closeVisible=${closeVisible}; avatar in .rad-pf2-av`
    );
  }

  // merge confirm (seed)
  const seed = spawnSync("npx", ["tsx", "scripts/chat-f2-seed-confirm.ts"], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    shell: true,
  });
  if (seed.status === 0) {
    const line = (seed.stdout || "").trim().split(/\r?\n/).filter(Boolean).pop();
    const data = JSON.parse(line);
    await page.goto(`${BASE}/admin/inbox/${data.unlinkedConversationId}`, {
      waitUntil: "networkidle",
    });
    await page.locator(".rad-ctxbtn").first().click().catch(() => {});
    await page.waitForTimeout(600);
    const linkBtn = page.locator("[data-f2-link-trader]").first();
    if (await linkBtn.isVisible().catch(() => false)) {
      await linkBtn.click();
      await page.waitForSelector("[data-f2-merge-confirm]", { timeout: 15000 });
      const body = await page.locator("[data-f2-merge-confirm]").innerText();
      await shot(
        page,
        "closure-merge-confirm-1440.png",
        `Merge confirm dialog; body≈${JSON.stringify(body.slice(0, 160))}`
      );
    } else {
      NOTES.push("- **closure-merge-confirm-1440.png:** SKIPPED (link button hidden — shared phone or already linked)");
    }
  }

  // trader
  const traderLogin = `${BASE}/trader/login`;
  await page.goto(traderLogin, { waitUntil: "domcontentloaded" });
  const traderEmail = process.env.TRADER_EMAIL || "trader@rareoud.local";
  const traderPass = process.env.TRADER_PASSWORD || "ChangeMeNow!";
  if (await page.locator('input[name="email"]').count()) {
    await page.fill('input[name="email"]', traderEmail);
    await page.fill('input[name="password"]', traderPass);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" }).catch(() => {});
    await page.setViewportSize({ width: 1440, height: 900 });
    await shot(page, "closure-trader-1440.png", `Trader messages @1440; url=${page.url()}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await shot(page, "closure-trader-390.png", `Trader messages @390; composer vs tabs`);
  }

  fs.writeFileSync(path.join(OUT, "SEE.md"), `# Closure polish SEE\n\n${NOTES.join("\n")}\n`);
  await browser.close();
  console.log("NOTES written");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
