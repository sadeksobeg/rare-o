/**
 * WA-V — verify overlays on REAL /admin/inbox (not /dev).
 * Asserts every open menu/dialog stays inside the viewport and is not clipped.
 *
 * Run (local): ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/wa-v-inbox-overlay-gate.mjs
 * Optional: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/wa-v");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_")) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function assertInViewport(box, label, vw, vh) {
  if (!box) throw new Error(`${label}: no bounding box`);
  const pad = 1;
  if (box.x < -pad || box.y < -pad) {
    throw new Error(`${label}: outside viewport (x=${box.x}, y=${box.y})`);
  }
  if (box.x + box.width > vw + pad || box.y + box.height > vh + pad) {
    throw new Error(
      `${label}: overflows viewport (right=${box.x + box.width}, bottom=${box.y + box.height}, vw=${vw}, vh=${vh})`
    );
  }
  if (box.width < 8 || box.height < 8) {
    throw new Error(`${label}: degenerate size ${box.width}x${box.height}`);
  }
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30000,
  });
}

async function openFirstThread(page) {
  await page.goto(`${BASE}/admin/inbox`, { waitUntil: "networkidle" });
  const row = page.locator(".rad-cv a, a.rad-cv, .rad-lc a[href*='/admin/inbox/']").first();
  await row.waitFor({ timeout: 20000 });
  await row.click();
  await page.waitForURL(/\/admin\/inbox\/[^/]+/, { timeout: 20000 });
  await page.locator(".rad-th").waitFor({ timeout: 15000 });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') || document.documentElement;
    root.setAttribute("data-theme", t);
  }, theme);
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL / ADMIN_PASSWORD");
  }
  fs.mkdirSync(OUT, { recursive: true });
  const report = { ok: false, shots: [], checks: [], errors: [] };

  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ar", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await login(page);
    await openFirstThread(page);

    for (const theme of ["dark", "light"]) {
      await setTheme(page, theme);
      const vp = page.viewportSize();
      const vw = vp.width;
      const vh = vp.height;

      // ⋯ overflow menu
      const more = page
        .locator(
          '.rad-th .rad-th-ov button[aria-haspopup="menu"], .rad-th .rad-ov button[aria-haspopup="menu"], .rad-th .rad-acts button[aria-haspopup="menu"]'
        )
        .first();
      await more.click();
      const ovMenu = page
        .locator(
          ".rad-fixed-menu.rad-th-menu, .rad-fixed-menu.rad-ov-menu, .rad-overlay-layer .rad-ov-menu, .rad-overlay-layer .rad-th-menu"
        )
        .first();
      await ovMenu.waitFor({ state: "visible", timeout: 5000 });
      assertInViewport(await ovMenu.boundingBox(), `overflow-menu-${theme}`, vw, vh);
      const shotOv = path.join(OUT, `gate-overflow-${theme}-1440.png`);
      await page.screenshot({ path: shotOv, fullPage: false });
      report.shots.push(shotOv);
      report.checks.push(`overflow-menu-${theme}: in viewport`);
      await page.keyboard.press("Escape");

      // Attach menu (skip if media blocked locally — outbound/kill/disconnected)
      const attach = page.locator('.rad-cbr .rad-attach button[aria-haspopup="menu"]').first();
      if ((await attach.count()) && (await attach.isEnabled())) {
        await attach.click();
        const atMenu = page.locator(".rad-fixed-menu.rad-attach-menu, .rad-overlay-layer .rad-attach-menu").first();
        await atMenu.waitFor({ state: "visible", timeout: 5000 });
        assertInViewport(await atMenu.boundingBox(), `attach-menu-${theme}`, vw, vh);
        const shotAt = path.join(OUT, `gate-attach-${theme}-1440.png`);
        await page.screenshot({ path: shotAt, fullPage: false });
        report.shots.push(shotAt);
        report.checks.push(`attach-menu-${theme}: in viewport`);
        await page.keyboard.press("Escape");
      } else {
        report.checks.push(`attach-menu-${theme}: skipped (disabled/media-blocked)`);
      }

      // Emoji
      const emoji = page.locator('.rad-cbr .rad-emoji button[aria-haspopup="dialog"]').first();
      if ((await emoji.count()) && (await emoji.isEnabled())) {
        await emoji.click();
        const panel = page.locator(".rad-fixed-menu.rad-emoji-panel, .rad-overlay-layer .rad-emoji-panel").first();
        await panel.waitFor({ state: "visible", timeout: 5000 });
        assertInViewport(await panel.boundingBox(), `emoji-${theme}`, vw, vh);
        const shotEm = path.join(OUT, `gate-emoji-${theme}-1440.png`);
        await page.screenshot({ path: shotEm, fullPage: false });
        report.shots.push(shotEm);
        report.checks.push(`emoji-${theme}: in viewport`);
        await page.keyboard.press("Escape");
      } else {
        report.checks.push(`emoji-${theme}: skipped (disabled)`);
      }

      // Thread chrome (no gray tip slab over ⋯)
      const tipGhost = await page.evaluate(() => {
        const tips = [...document.querySelectorAll(".rad-th .rad-ib")];
        return tips.some((el) => {
          const after = getComputedStyle(el, "::after");
          return after && after.content && after.content !== "none" && after.content !== '""';
        });
      });
      if (tipGhost) {
        throw new Error(`header tip ::after visible in ${theme} — gray slab risk`);
      }
      report.checks.push(`header-tips-${theme}: suppressed`);

      const shotThread = path.join(OUT, `gate-thread-${theme}-1440.png`);
      await page.screenshot({ path: shotThread, fullPage: false });
      report.shots.push(shotThread);
    }

    // Mobile attach clip check
    await page.setViewportSize({ width: 390, height: 844 });
    await setTheme(page, "dark");
    const attachM = page.locator('.rad-cbr .rad-attach button[aria-haspopup="menu"]').first();
    if ((await attachM.count()) && (await attachM.isEnabled())) {
      await attachM.click();
      const atMenu = page.locator(".rad-fixed-menu.rad-attach-menu").first();
      await atMenu.waitFor({ state: "visible", timeout: 5000 });
      assertInViewport(await atMenu.boundingBox(), "attach-menu-390", 390, 844);
      const shotM = path.join(OUT, "gate-attach-dark-390.png");
      await page.screenshot({ path: shotM, fullPage: false });
      report.shots.push(shotM);
      report.checks.push("attach-menu-390: in viewport");
    } else {
      // Still capture thread chrome at 390
      const shotM = path.join(OUT, "gate-thread-dark-390.png");
      await page.screenshot({ path: shotM, fullPage: false });
      report.shots.push(shotM);
      report.checks.push("attach-menu-390: skipped (disabled); thread shot saved");
    }

    report.ok = true;
  } catch (e) {
    report.errors.push(String(e?.stack || e));
    try {
      const failShot = path.join(OUT, "gate-FAIL.png");
      await page.screenshot({ path: failShot, fullPage: false });
      report.shots.push(failShot);
    } catch {
      /* ignore */
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(OUT, "OVERLAY-GATE.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main();
