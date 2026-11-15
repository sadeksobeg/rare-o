/**
 * WA-V production screenshots of /admin/inbox (live rareoud.com).
 * Uses ADMIN_EMAIL / ADMIN_PASSWORD from .env — never logs secrets.
 *
 *   PLAYWRIGHT_BASE_URL=https://rareoud.com node scripts/wa-v-prod-shots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/wa-v/prod-shots");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "https://rareoud.com";

function loadDotEnv() {
  for (const name of [".env.production.local", ".env.local", ".env"]) {
    const envPath = path.join(ROOT, name);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (!(k in process.env) || !process.env[k]) process.env[k] = v;
    }
  }
}
loadDotEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.PROD_ADMIN_EMAIL;
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || process.env.PROD_ADMIN_PASSWORD;

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 25000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 8 });
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await setVal(page, 'input[name="email"]', ADMIN_EMAIL);
  await setVal(page, 'input[name="password"]', ADMIN_PASSWORD);
  const totp =
    process.env.ADMIN_TOTP ||
    process.env.PROD_ADMIN_TOTP ||
    process.env.ADMIN_RECOVERY_CODE ||
    "";
  if (totp) {
    const totpInput = page.locator(
      'input[name="totp"], input[name="code"], input[name="otp"], input[autocomplete="one-time-code"]'
    ).first();
    if (await totpInput.count()) {
      await totpInput.fill(totp);
    }
  }
  await page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click();
  try {
    await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
  } catch (e) {
    const body = (await page.locator("body").innerText()).slice(0, 400);
    fs.mkdirSync(OUT, { recursive: true });
    await page.screenshot({
      path: path.join(OUT, "prod-login-FAIL.png"),
      fullPage: false,
    });
    throw new Error(`login_failed body=${body.replace(/\s+/g, " ")}`);
  }
}

async function openInbox(page) {
  await page.goto(`${BASE}/admin/inbox`, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Prefer first conversation if list has rows
  const row = page.locator("a.rad-cv").first();
  try {
    await row.waitFor({ timeout: 12000 });
    await row.click();
    await page.waitForURL(/\/admin\/inbox\/[^/]+/, { timeout: 20000 });
  } catch {
    // stay on list
  }
  await page.locator(".rad-th, .rad-cl, .rad-ct").first().waitFor({ timeout: 20000 });
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root =
      document.querySelector('[data-portal="admin"]') || document.documentElement;
    root.setAttribute("data-theme", t);
  }, theme);
  await page.waitForTimeout(250);
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (or PROD_*)");
  }
  fs.mkdirSync(OUT, { recursive: true });
  const notes = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "ar",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await login(page);
  await openInbox(page);

  for (const theme of ["dark", "light"]) {
    await setTheme(page, theme);
    await page.setViewportSize({ width: 1440, height: 900 });
    const name = `prod-inbox-1440-${theme}.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    const see =
      theme === "dark"
        ? "إنتاج 1440 داكن: صندوق وارد / خيط مع ترويسة وملحن واتساب"
        : "إنتاج 1440 فاتح: نفس الشاشة بثيم فاتح";
    notes.push({ name, see });
    console.log(`SEE ${name}: ${see}`);
  }

  await setTheme(page, "dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const name390 = "prod-inbox-390-dark.png";
  await page.screenshot({ path: path.join(OUT, name390), fullPage: false });
  notes.push({
    name: name390,
    see: "إنتاج 390 داكن: تخطيط الجوال للصندوق (قائمة أو خيط)",
  });
  console.log(`SEE ${name390}: ${notes[notes.length - 1].see}`);

  fs.writeFileSync(
    path.join(OUT, "NOTES.md"),
    notes.map((n) => `- **${n.name}:** ${n.see}`).join("\n") + "\n",
    "utf8"
  );
  await browser.close();
  console.log("wa-v-prod-shots: done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
