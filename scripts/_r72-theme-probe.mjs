import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await (
  await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ar" })
).newPage();
await page.addInitScript(() => {
  try {
    localStorage.setItem("ro-portal-theme-v5", "dark");
  } catch {
    /* ignore */
  }
});
await page.goto("http://localhost:3000/trader/login", { waitUntil: "networkidle" });
await page.locator("#email").fill("trader@rareoud.local");
await page.locator("#password").fill("ChangeMeNow!");
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
await page.goto("http://localhost:3000/trader", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "dark"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const root = document.querySelector(".ro-portal[data-portal]");
  const a = document.querySelector('a[href$="offers"]');
  const walk = [];
  let n = a;
  while (n && n !== document.documentElement) {
    const cs = getComputedStyle(n);
    walk.push({
      tag: n.tagName,
      cls: String(n.className).slice(0, 80),
      bg: cs.backgroundColor,
    });
    n = n.parentElement;
  }
  return {
    theme: root?.getAttribute("data-theme"),
    rootBg: root ? getComputedStyle(root).backgroundColor : null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    walk,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
