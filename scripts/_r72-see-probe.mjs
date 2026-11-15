import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ar" })).newPage();
await page.goto("http://localhost:3000/trader/login", { waitUntil: "networkidle" });
await page.locator("#email").fill("trader@rareoud.local");
await page.locator("#password").fill("ChangeMeNow!");
await page.getByRole("button", { name: /دخول|Sign in/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
await page.goto("http://localhost:3000/trader", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.setItem("ro-portal-theme-v5", "light"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.evaluate(() => { const el = document.activeElement; if (el instanceof HTMLElement) el.blur(); });
const see = await page.evaluate(() => {
  const waitingCard = document.querySelector(".rad-tsh + .rad-card");
  const a = waitingCard?.querySelector("a");
  const cs = a ? getComputedStyle(a) : null;
  const chips = [...document.querySelectorAll("ol [class*='inline-flex'], ol span")]
    .map((n) => (n.textContent || "").trim())
    .filter((t) => t.length > 1 && t.length < 40)
    .slice(0, 20);
  return {
    hero: document.querySelector(".rad-thero p")?.textContent?.trim(),
    waitingLink: document.querySelector(".rad-tsh a")?.textContent?.trim(),
    outline: cs ? { outline: cs.outline, outlineWidth: cs.outlineWidth, boxShadow: cs.boxShadow, border: cs.border } : null,
    waiting: waitingCard ? { h: waitingCard.getBoundingClientRect().height, minH: getComputedStyle(waitingCard).minHeight, childH: waitingCard.firstElementChild?.getBoundingClientRect().height } : null,
    chips,
    hasTajir: document.body.innerText.includes("التاجر"),
  };
});
console.log(JSON.stringify(see, null, 2));
await browser.close();
