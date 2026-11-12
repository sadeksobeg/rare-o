import { chromium } from "@playwright/test";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-trader");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (!(k in process.env) || !process.env[k] || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}

const prisma = new PrismaClient();
const trader = await prisma.traderAccount.findUnique({
  where: { email: "trader@rareoud.local" },
});
const token = await new SignJWT({
  email: trader.email,
  displayName: trader.displayName,
  role: "trader",
  mustChangePassword: false,
  pwv: trader.passwordChangedAt?.getTime() ?? 0,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(trader.id)
  .setIssuedAt()
  .setExpirationTime("12h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
await prisma.$disconnect();

const shots = [
  { file: "r91-aspect-offers-light-1440-ar.png", w: 1440, h: 900 },
  { file: "r91-aspect-offers-light-390-ar.png", w: 390, h: 844 },
];

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ar" });
await context.addCookies([
  {
    name: "ro_trader_session",
    value: token,
    url: BASE,
    httpOnly: true,
    sameSite: "Lax",
  },
]);
const page = await context.newPage();

for (const s of shots) {
  await page.setViewportSize({ width: s.w, height: s.h });
  await page.addInitScript(() => {
    localStorage.setItem("ro-portal-theme-v5", "light");
  });
  await page.goto(`${BASE}/trader/offers`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.waitForSelector("article.rad-card [data-offer-media]", {
    timeout: 20000,
  });
  // Skip mid-animation captures: force final reveal styles.
  await page.evaluate(() => {
    document.querySelectorAll(".ro-anim-reveal-up").forEach((n) => {
      const el = n as HTMLElement;
      el.classList.add("is-visible");
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.transition = "none";
    });
  });
  await page.waitForTimeout(200);
  await hideNextDevIndicator(page);
  const metrics = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("article.rad-card")];
    return cards.map((card) => {
      const media = card.querySelector("[data-offer-media]");
      const img = media?.querySelector("img");
      const mr = media?.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const reveal = card.closest(".ro-anim-reveal-up");
      const rs = reveal ? getComputedStyle(reveal) : null;
      return {
        cardH: Math.round(cr.height),
        mediaW: Math.round(mr?.width ?? 0),
        mediaH: Math.round(mr?.height ?? 0),
        ratio: mr && mr.height ? Number((mr.width / mr.height).toFixed(3)) : null,
        imgNatural: img ? `${img.naturalWidth}x${img.naturalHeight}` : null,
        revealOpacity: rs?.opacity ?? null,
        revealVisible: reveal?.classList.contains("is-visible") ?? null,
      };
    });
  });
  console.log(s.file, JSON.stringify(metrics));
  // Clip to first card so SEE is honest about media proportions.
  const first = page.locator("article.rad-card").first();
  await first.scrollIntoViewIfNeeded();
  await first.screenshot({ path: path.join(OUT, s.file.replace(".png", "-card.png")) });
  await page.screenshot({ path: path.join(OUT, s.file), fullPage: true });
  console.log("wrote", s.file);
}

await browser.close();
