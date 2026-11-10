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
const client = await page.context().newCDPSession(page);
await client.send("Runtime.enable");
client.on("Runtime.exceptionThrown", (e) => {
  const d = e.exceptionDetails;
  console.log(
    "EXCEPTION",
    d.text,
    d.exception?.description?.slice(0, 300),
    d.url,
    d.lineNumber,
    d.columnNumber,
    d.scriptId
  );
});
page.on("requestfailed", (r) =>
  console.log("REQFAIL", r.url().slice(0, 120), r.failure()?.errorText)
);

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.locator("#email").fill(process.env.ADMIN_EMAIL);
await page.locator("#password").fill(process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"));
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await browser.close();
