/**
 * Round 3.1 — capture inbox list + open thread at 1440 / 1100 / 390, ar, dark+light.
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/pilot-r31-inbox-shots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r2");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    v = v.replace(/^["']|["']$/g, "");
    // Prefer .env over stale/quoted shell exports for auth keys
    if (
      !(k in process.env) ||
      !process.env[k] ||
      k.startsWith("ADMIN_") ||
      k === "DATABASE_URL"
    ) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const VIEWPORTS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 1100, h: 800, tag: "1100" },
  { w: 390, h: 844, tag: "390" },
];
const THEMES = ["dark", "light"];

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') ||
      document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "light") root.classList.add("light");
    else root.classList.remove("light");
  }, theme);
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL / ADMIN_PASSWORD");
  }
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();

  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  // Optional 2FA / recovery field — leave empty unless provided
  const otp = process.env.ADMIN_2FA_CODE || process.env.ADMIN_TOTP_CODE;
  const otpInput = page.locator(
    'input[name="otp"], input[name="totp"], input[name="code"], input[name="recoveryCode"]'
  );
  if (otp && (await otpInput.count())) {
    await otpInput.first().fill(otp);
  }
  await page.locator('button[type="submit"]').first().click();
  try {
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20000,
    });
  } catch (err) {
    const probe = path.join(OUT, "round3.1-login-fail.png");
    await page.screenshot({ path: probe, fullPage: false });
    const body = (await page.locator("body").innerText()).slice(0, 600);
    throw new Error(`login failed; url=${page.url()} body=${body}`);
  }

  const shots = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    for (const theme of THEMES) {
      await page.goto(`${BASE}/admin/inbox`, { waitUntil: "networkidle" });
      await setTheme(page, theme);
      await page.waitForTimeout(250);
      const listName = `round3.1-list-${theme}-${vp.tag}-ar.png`;
      const listPath = path.join(OUT, listName);
      await page.screenshot({ path: listPath, fullPage: false });
      shots.push(listName);

      // Open first conversation via href (avoids off-canvas panel hit-testing)
      const firstHref = await page.locator(".rad-cv").first().getAttribute("href");
      if (firstHref) {
        await page.goto(`${BASE}${firstHref}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);
        await setTheme(page, theme);
        // Open context panel on mid/narrow so LinkedRecordPanel is visible
        if (vp.w <= 1320) {
          const ctxBtn = page.locator("#ctxb, .rad-ctxbtn").first();
          if (await ctxBtn.count()) {
            await ctxBtn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(250);
          }
        }
        const threadName = `round3.1-thread-${theme}-${vp.tag}-ar.png`;
        const threadPath = path.join(OUT, threadName);
        await page.screenshot({ path: threadPath, fullPage: false });
        shots.push(threadName);
      }

      // Horizontal overflow check
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          ibx: (() => {
            const el = document.querySelector(".rad-ibx");
            if (!el) return null;
            return {
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
            };
          })(),
        };
      });
      const hasHScroll =
        overflow.scrollWidth > overflow.clientWidth + 1 ||
        (overflow.ibx && overflow.ibx.scrollWidth > overflow.ibx.clientWidth + 1);
      if (hasHScroll) {
        console.log("H_OVERFLOW", theme, vp.tag, JSON.stringify(overflow));
      } else {
        console.log("NO_H_OVERFLOW", theme, vp.tag);
      }

      // Raw unsupported token check
      const raw = await page.evaluate(() =>
        /\[unsupported(?::[^\]]*)?\]/i.test(document.body.innerText)
      );
      console.log(raw ? "RAW_UNSUPPORTED_VISIBLE" : "NO_RAW_UNSUPPORTED", theme, vp.tag);
    }
  }

  console.log(JSON.stringify({ ok: true, shots }, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
