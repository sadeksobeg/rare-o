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
  const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k]) process.env[k] = v;
}
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/ui/wa-v/GATE-SEED.json"), "utf8"));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "ar" });
await page.goto("http://127.0.0.1:3000/admin/login");
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto(`http://127.0.0.1:3000/admin/inbox/${seed.conversationId}`, {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(2500);
const info = await page.evaluate(() => ({
  bubbles: [...document.querySelectorAll(".rad-bb")].map((el) => ({
    cls: el.className,
    text: el.textContent?.slice(0, 80),
  })),
  mediaImg: document.querySelectorAll(".rad-media-img").length,
  mediaCap: [...document.querySelectorAll(".rad-media-cap")].map((e) => e.textContent),
}));
console.log(JSON.stringify(info, null, 2));
await page.screenshot({
  path: path.join(ROOT, "docs/ui/wa-v/probe-seed.png"),
  fullPage: false,
});
await browser.close();
