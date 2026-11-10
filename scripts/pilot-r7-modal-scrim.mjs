import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r7");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_")) process.env[k] = v;
}

const DEAL = "cmw877g90000cepg8j0xstnj9";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ar" });
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.locator("#email").fill(process.env.ADMIN_EMAIL);
await page.locator("#password").fill(process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto(`${BASE}/admin/deals/${DEAL}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.locator("button.rad-btn.rad-pri").first().click();
await page.waitForTimeout(400);
const scrim = await page.evaluate(() => {
  const el =
    document.querySelector("[data-rad-modal-scrim]") ||
    document.querySelector(".rad-mo.rad-on");
  if (!el) return { ok: false, note: "no_scrim", bodyChild: !!document.body.querySelector(".rad-mo") };
  const r = el.getBoundingClientRect();
  return {
    ok: r.width >= innerWidth * 0.95 && r.height >= innerHeight * 0.95,
    width: r.width,
    height: r.height,
    vw: innerWidth,
    vh: innerHeight,
    parent: el.parentElement?.tagName,
  };
});
fs.writeFileSync(path.join(OUT, "modal-scrim-gate.json"), JSON.stringify(scrim, null, 2));
console.log(scrim);
await browser.close();
