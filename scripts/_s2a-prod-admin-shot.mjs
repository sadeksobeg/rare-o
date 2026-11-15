import { chromium } from "@playwright/test";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dns.setDefaultResultOrder("ipv4first");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/shipping/s2a");
const token = fs.readFileSync(
  process.env.RO_ADMIN_SHOT_TOKEN_FILE || "D:/tmp/s2a-admin.token",
  "utf8"
).trim();

const browser = await chromium.launch({
  headless: true,
  args: [
    "--dns-result-order=ipv4first",
    "--host-resolver-rules=MAP rareoud.com 72.62.155.198",
  ],
});
const ctx = await browser.newContext({
  locale: "ar",
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
});
await ctx.addCookies([
  {
    name: "ro_admin_session",
    value: token,
    domain: "rareoud.com",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  },
]);
const page = await ctx.newPage();
await page.goto("https://rareoud.com/admin/shipping/rates", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForTimeout(1500);
const url = page.url();
console.log("landed", url);
if (url.includes("/login")) {
  await page.screenshot({ path: path.join(OUT, "prod-admin-login-reject.png") });
  throw new Error("admin session rejected");
}
const text = await page.locator("body").innerText();
const needs = (text.match(/يحتاج تحقق|needs verification|غير معتمد|unverified/gi) || []).length;
await page.screenshot({
  path: path.join(OUT, "prod-admin-shipping-rates-light-1440-ar.png"),
  fullPage: false,
});
console.log(
  JSON.stringify({
    path: new URL(url).pathname,
    needsMentions: needs,
    hasMatrixHint: /سعر|rate|طريقة|method|دولة|country/i.test(text),
    see: `SEE prod-admin-shipping-rates-light-1440-ar.png: I SEE admin rates matrix; verification-word hits=${needs}`,
  })
);
await browser.close();
