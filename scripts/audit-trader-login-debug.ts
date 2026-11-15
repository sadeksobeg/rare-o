import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

async function main() {
  mkdirSync("docs/ui/wa-v/internal-chat", { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3000/trader/login", {
    waitUntil: "networkidle",
  });
  await page.locator('input[name="email"]').click();
  await page.keyboard.type("trader@rareoud.local", { delay: 15 });
  await page.locator('input[name="password"]').click();
  await page.keyboard.type("ChangeMeNow!", { delay: 15 });
  console.log({
    email: await page.locator('input[name="email"]').inputValue(),
    pass: (await page.locator('input[name="password"]').inputValue()).length,
  });
  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes("/trader/login"),
      { timeout: 20000 }
    ),
    page.getByRole("button", { name: /sign in|دخول|تسجيل/i }).click(),
  ]);
  console.log("post", resp.status(), resp.headers()["content-type"]);
  const body = await resp.text();
  console.log("bodyHead", body.slice(0, 300));
  await page.waitForTimeout(1500);
  console.log("url", page.url());
  console.log("text", (await page.locator("body").innerText()).slice(0, 700));
  await page.screenshot({
    path: "docs/ui/wa-v/internal-chat/login-after.png",
    fullPage: true,
  });
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
