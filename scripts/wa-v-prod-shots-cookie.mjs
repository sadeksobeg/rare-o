/**
 * WA-V prod screenshots using a short-lived ro_admin_session cookie
 * (minted on VPS; never logged). Token from RO_ADMIN_SHOT_TOKEN or file path.
 */
import { chromium } from "@playwright/test";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dns.setDefaultResultOrder("ipv4first");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/wa-v/prod-shots");

function loadToken() {
  if (process.env.RO_ADMIN_SHOT_TOKEN?.trim()) {
    return process.env.RO_ADMIN_SHOT_TOKEN.trim();
  }
  const p = process.env.RO_ADMIN_SHOT_TOKEN_FILE || "D:/tmp/ro_admin_shot_token";
  if (fs.existsSync(p)) return fs.readFileSync(p, "utf8").trim();
  throw new Error("missing RO_ADMIN_SHOT_TOKEN");
}

async function main() {
  const token = loadToken();
  const base = (process.env.PLAYWRIGHT_BASE_URL || "https://rareoud.com").replace(
    /\/$/,
    ""
  );
  const viaTunnel = /127\.0\.0\.1|localhost/.test(base);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "ar",
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies([
    {
      name: "ro_admin_session",
      value: token,
      domain: viaTunnel ? "127.0.0.1" : "rareoud.com",
      path: "/",
      httpOnly: true,
      secure: !viaTunnel,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  await page.goto(`${base}/admin/inbox`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  const url = page.url();
  console.log("landed_path", new URL(url).pathname);
  if (url.includes("/login")) {
    await page.screenshot({
      path: path.join(OUT, "prod-login-reject.png"),
      fullPage: false,
    });
    throw new Error("session rejected — still on login");
  }
  const row = page.locator("a.rad-cv").first();
  if (await row.count()) {
    await row.click();
    await page.waitForTimeout(1500);
  }
  async function theme(t) {
    await page.evaluate((th) => {
      const root =
        document.querySelector('[data-portal="admin"]') ||
        document.documentElement;
      root.setAttribute("data-theme", th);
    }, t);
    await page.waitForTimeout(300);
  }
  await theme("dark");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: path.join(OUT, "prod-inbox-1440-dark.png"),
    fullPage: false,
  });
  console.log(
    "SEE prod-inbox-1440-dark.png: إنتاج 1440 داكن — خيط/صندوق واتساب حي"
  );
  await theme("light");
  await page.screenshot({
    path: path.join(OUT, "prod-inbox-1440-light.png"),
    fullPage: false,
  });
  console.log("SEE prod-inbox-1440-light.png: إنتاج 1440 فاتح — نفس الشاشة");
  await theme("dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT, "prod-inbox-390-dark.png"),
    fullPage: false,
  });
  console.log("SEE prod-inbox-390-dark.png: إنتاج 390 داكن — تخطيط جوال");
  fs.writeFileSync(
    path.join(OUT, "NOTES.md"),
    [
      "- **prod-inbox-1440-dark.png:** إنتاج 1440 داكن — خيط/صندوق واتساب حي",
      "- **prod-inbox-1440-light.png:** إنتاج 1440 فاتح — نفس الشاشة",
      "- **prod-inbox-390-dark.png:** إنتاج 390 داكن — تخطيط جوال",
    ].join("\n") + "\n"
  );
  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
