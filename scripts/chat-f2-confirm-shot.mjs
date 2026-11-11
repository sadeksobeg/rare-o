/**
 * CHAT-F2 — one 1440 shot of the manual-merge confirmation dialog.
 *   node scripts/chat-f2-confirm-shot.mjs
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
  for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}
loadDotEnv();

function seedConfirm() {
  const r = spawnSync("npx", ["tsx", "scripts/chat-f2-seed-confirm.ts"], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error("confirm seed failed");
  }
  const line = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean).pop();
  return JSON.parse(line);
}

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 30000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 4 });
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', process.env.ADMIN_EMAIL);
  await setVal(page, 'input[name="password"]', process.env.ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 90000 }),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

const seeded = seedConfirm();
console.log("seed", seeded);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "ar-SA",
  colorScheme: "dark",
});
const page = await ctx.newPage();
try {
  await loginAdmin(page);
  await page.goto(`${BASE}/admin/inbox/${seeded.unlinkedConversationId}`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForSelector("[data-f2-link-trader], .rad-link-suggest", {
    timeout: 30000,
  });
  const btn = page.locator("[data-f2-link-trader]").first();
  await btn.waitFor({ state: "visible", timeout: 15000 });
  await btn.click();
  await page.waitForSelector("[data-f2-merge-confirm]", { timeout: 20000 });
  await page.waitForTimeout(400);
  await page
    .addStyleTag({
      content:
        "nextjs-portal,[data-nextjs-toast],[data-next-badge],#__next-build-watcher,[data-nextjs-dialog-overlay],[data-nextjs-dev-overlay]{display:none!important}",
    })
    .catch(() => {});
  const file = path.join(OUT, "f2-merge-confirm-1440.png");
  await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
  const body = await page.locator("[data-f2-merge-confirm]").evaluate((el) => {
    const dlg = el.closest("dialog") || el.parentElement;
    return (dlg?.innerText || el.innerText || "").slice(0, 400);
  });
  const see = `Confirm dialog @1440: SEE title + merge counts (secondary/messages) + تأكيد/إلغاء. text≈${JSON.stringify(body.replace(/\s+/g, " ").slice(0, 220))}`;
  fs.writeFileSync(
    path.join(OUT, "CONFIRM-SEE.txt"),
    see + "\n",
    "utf8"
  );
  console.log("SEE", see);
  console.log("F2_CONFIRM_SHOT_DONE");
} finally {
  await browser.close();
}
