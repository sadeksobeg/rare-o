import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k.startsWith("ADMIN_")) process.env[k] = v;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push({ type: "pageerror", msg: String(e), stack: e.stack }));
page.on("console", (m) => {
  if (m.type() === "error") errors.push({ type: "console", msg: m.text(), loc: m.location() });
});
page.on("response", async (r) => {
  if (r.status() >= 400 && r.url().includes("_next")) {
    errors.push({ type: "http", status: r.status(), url: r.url().slice(0, 160) });
  }
});

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.locator("#email").fill(process.env.ADMIN_EMAIL);
await page.locator("#password").fill(process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1500);
console.log(JSON.stringify(errors, null, 2));
await browser.close();
