/**
 * Pre-deploy gate: platform-fallback admin reply must leave the clock
 * (pending/sending) and show a sent tick within ~3s.
 *   node scripts/chat-f11-sent-gate.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/chat/shots/owner");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
console.log("sent-gate v2");

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k]) process.env[k] = v;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL/PASSWORD required");

fs.mkdirSync(OUT, { recursive: true });

function inspectBubble(el) {
  const labels = [];
  for (const n of el.querySelectorAll("[aria-label]")) {
    labels.push(n.getAttribute("aria-label") || "");
  }
  const svgs = [];
  for (const s of el.querySelectorAll("svg")) {
    svgs.push(s.getAttribute("class") || s.outerHTML.slice(0, 100));
  }
  const text = el.innerText.replace(/\s+/g, " ").trim().slice(0, 120);
  const hasLoader = svgs.some((s) => /loader/i.test(s));
  const hasCheck = svgs.some((s) => /check/i.test(s));
  return {
    label: labels.filter(Boolean).join(" | "),
    text,
    hasLoader,
    hasCheck,
    svgs: svgs.slice(0, 6),
  };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', ADMIN_EMAIL);
await page.fill('input[name="password"]', ADMIN_PASSWORD);
await Promise.all([
  page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }),
  page.getByRole("button", { name: /sign in|دخول|تسجيل/i }).click(),
]);

await page.goto(`${BASE}/admin/inbox`, { waitUntil: "domcontentloaded" });
const row = page.locator("a.rad-cv").filter({ hasText: /Demo|تاجر/i }).first();
if (await row.count()) await row.click();
else await page.locator("a.rad-cv").first().click();
await page.waitForURL(/\/admin\/inbox\/[^/]+/, { timeout: 20000 });
await page.locator(".rad-cmp textarea").first().waitFor({ timeout: 20000 });

const marker = `sent-gate-${Date.now()}`;
await page.locator(".rad-cmp textarea").first().fill(marker);
await page.locator(".rad-sendb").first().click();

const bubble = page.locator(".rad-bb").filter({ hasText: marker }).first();
await bubble.waitFor({ state: "visible", timeout: 10000 });

const deadline = Date.now() + 3000;
let final = null;
while (Date.now() < deadline) {
  final = await bubble.evaluate(inspectBubble);
  if (final.hasCheck && !final.hasLoader) break;
  await page.waitForTimeout(150);
}

await page
  .addStyleTag({
    content:
      "nextjs-portal,[data-nextjs-toast],[data-next-badge]{display:none!important}",
  })
  .catch(() => {});
const shot = path.join(OUT, "09-admin-fallback-sent-tick.png");
await page.screenshot({ path: shot, fullPage: false });

const ok = Boolean(final?.hasCheck && !final?.hasLoader);
const see = ok
  ? `SEE: فقاعة «${marker}» خرجت من الساعة إلى علامة إرسال خلال ≤3ث؛ hasCheck=${final.hasCheck} hasLoader=${final.hasLoader} label=${final.label}`
  : `DEFECT: بقيت على الساعة بعد 3ث — ${JSON.stringify(final)}`;

console.log(see);
fs.writeFileSync(path.join(OUT, "09-SEE.txt"), see + "\n", "utf8");
await browser.close();
if (!ok) process.exit(1);
console.log("chat-f11-sent-gate: PASS");
