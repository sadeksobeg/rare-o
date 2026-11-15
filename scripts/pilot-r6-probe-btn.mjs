import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD") process.env[k] = v;
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
await page.goto("http://localhost:3000/admin/traders", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const styles = await page.getByRole("button", { name: /إضافة تاجر/ }).evaluate((el) => {
  const cs = getComputedStyle(el);
  const root = document.querySelector('[data-portal="admin"]');
  const rcs = root ? getComputedStyle(root) : null;
  return {
    color: cs.color,
    bg: cs.backgroundColor,
    inlineStyle: el.getAttribute("style"),
    dataVariant: el.getAttribute("data-ro-variant"),
    className: el.className,
    radBtn: rcs?.getPropertyValue("--rad-btn")?.trim(),
    radBtnTx: rcs?.getPropertyValue("--rad-btn-tx")?.trim(),
  };
});
console.log(JSON.stringify(styles, null, 2));
await browser.close();
