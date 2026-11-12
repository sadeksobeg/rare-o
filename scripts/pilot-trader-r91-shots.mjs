/**
 * Round 9.1 — focused recapture + scroll-bottom proofs.
 * Views: notifications, profile, wholesale list/new/detail, brokerage list/detail, offers
 * × light 1440 + dark 390, plus viewport scroll-bottom proofs.
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-trader");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
fs.mkdirSync(OUT, { recursive: true });

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (
    !(k in process.env) ||
    !process.env[k] ||
    k.startsWith("ADMIN_") ||
    k.startsWith("TRADER_") ||
    k === "DATABASE_URL"
  ) {
    process.env[k] = v;
  }
}

const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";

async function seedTheme(page, theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  const current = await page.evaluate(
    () =>
      document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") ||
      ""
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  }
  await page
    .waitForFunction(
      (t) =>
        document.querySelector(".ro-portal[data-portal]")?.getAttribute("data-theme") ===
        t,
      theme,
      { timeout: 15000 }
    )
    .catch(() => {});
}

async function waitSettled(page) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
  }).catch(() => {});
}

async function overflowCheck(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const cards = [
      ...document.querySelectorAll(".rad-card, .rad-dt, .rad-dh, [data-component]"),
    ];
    const cardFails = cards
      .map((el, i) => {
        const sw = el.scrollWidth;
        const cw = el.clientWidth;
        return {
          i,
          tag: el.className?.toString?.().slice(0, 40) || el.tagName,
          sw,
          cw,
          ok: sw <= cw + 1,
        };
      })
      .filter((c) => !c.ok);
    return {
      ok: doc.scrollWidth <= doc.clientWidth + 1 && cardFails.length === 0,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      cardFails,
    };
  });
}

const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 16) {
  console.error("AUTH_SECRET missing");
  process.exit(1);
}

const prisma = new PrismaClient();
const trader = await prisma.traderAccount.findUnique({
  where: { email: TRADER_EMAIL },
});
if (!trader) {
  console.error("NO_TRADER", TRADER_EMAIL);
  process.exit(1);
}
const wsId =
  (
    await prisma.wholesaleRequest.findFirst({
      where: { traderId: trader.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    })
  )?.id || null;
const brokerageId =
  (
    await prisma.brokerageRequest.findFirst({
      where: { traderId: trader.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    })
  )?.id || null;
const dealId =
  (
    await prisma.dealProposal.findFirst({
      where: { traderId: trader.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    })
  )?.id || null;
await prisma.$disconnect();

const traderToken = await new SignJWT({
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
  .sign(new TextEncoder().encode(secret));

const mainRoutes = [
  { route: "/trader/notifications", fileBase: "r91-trader-notifications" },
  { route: "/trader/profile", fileBase: "r91-trader-profile" },
  { route: "/trader/wholesale/requests", fileBase: "r91-trader-ws-requests" },
  { route: "/trader/wholesale", fileBase: "r91-trader-ws-new" },
  ...(wsId
    ? [{ route: `/trader/wholesale/${wsId}`, fileBase: "r91-trader-ws-detail" }]
    : []),
  { route: "/trader/brokerage", fileBase: "r91-trader-brokerage" },
  ...(brokerageId
    ? [
        {
          route: `/trader/brokerage/${brokerageId}`,
          fileBase: "r91-trader-brokerage-detail",
        },
      ]
    : []),
  { route: "/trader/offers", fileBase: "r91-trader-offers" },
];

const proofRoutes = [
  {
    route: "/trader/wholesale/requests",
    fileBase: "r91-proof-ws-list-scroll-bottom",
  },
  { route: "/trader/deals", fileBase: "r91-proof-deals-list-scroll-bottom" },
  ...(brokerageId
    ? [
        {
          route: `/trader/brokerage/${brokerageId}`,
          fileBase: "r91-proof-brokerage-timeline-scroll-bottom",
        },
      ]
    : []),
];

const combos = [
  { theme: "light", w: 1440, h: 900 },
  { theme: "dark", w: 390, h: 844 },
];

console.log("routes", mainRoutes.map((r) => r.route));
console.log("proofs", proofRoutes.map((r) => r.route), "dealId", dealId);

const browser = await chromium.launch();
const results = [];
const evidence = {};

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "ar",
  });
  await context.addCookies([
    {
      name: "ro_trader_session",
      value: traderToken,
      url: BASE,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("caret-color")) return;
    if (text.includes("A tree hydrated but some attributes")) return;
    consoleErrors.push(text);
  });

  async function capture({ route, fileBase, theme, w, h, scrollBottom }) {
    consoleErrors.length = 0;
    await page.setViewportSize({ width: w, height: h });
    await seedTheme(page, theme);
    await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await setTheme(page, theme);
    await waitSettled(page);
    await hideNextDevIndicator(page);
    await page.evaluate(() => {
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.blur();
    });
    await freeze(page);

    if (scrollBottom) {
      // Keep fixed viewport — do NOT sizeToDocument.
      await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await page.waitForTimeout(350);
      // Nudge so last content clears fixed tabbar in shot.
      await page.evaluate(() => {
        window.scrollBy(0, 40);
      });
      await page.waitForTimeout(150);
    } else {
      const docH = await page.evaluate(() =>
        Math.min(
          16000,
          Math.max(
            document.documentElement.scrollHeight,
            document.body?.scrollHeight || 0,
            window.innerHeight || 0
          )
        )
      );
      await page.setViewportSize({
        width: w,
        height: Math.max(Math.ceil(docH), h),
      });
    }

    const name = `${fileBase}-${theme}-${w}-ar.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    const overflow = await overflowCheck(page);
    const roPortalHits = await page.evaluate(
      () =>
        [
          ...document.querySelectorAll(
            '[class*="ro-portal-card"], [class*="ro-portal-icon-well"], [class*="ro-portal-section"], [class*="ro-portal-stagger"], [class*="ro-portal-tablist"], [class*="ro-portal-muted"], [class*="ro-portal-message"]'
          ),
        ].length
    );
    let axeViolations = 0;
    let axeIds = [];
    try {
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      axeViolations = axe.violations.length;
      axeIds = axe.violations.map((v) => v.id);
    } catch (e) {
      consoleErrors.push(`axe:${e}`);
    }
    const h1 =
      (await page.locator("h1").first().textContent().catch(() => "")) || "";
    let seeNote = scrollBottom
      ? "viewport scrolled to bottom; last content above tabbar"
      : "layout settled; chrome matches ui-kit";
    if (!overflow.ok) seeNote = "visible overflow on doc/card";
    else if (axeViolations) seeNote = `axe:${axeIds.slice(0, 3).join(",")}`;
    else if (consoleErrors.length) seeNote = "console errors present";
    else if (roPortalHits > 0) seeNote = "legacy ro-portal classes remain";
    const see = [
      route,
      `${theme}@${w}${scrollBottom ? ":scroll-bottom" : ""}`,
      !overflow.ok ? "H-OVERFLOW" : null,
      consoleErrors.length ? `console×${consoleErrors.length}` : null,
      axeViolations ? `axe×${axeViolations}` : null,
      `ro-portal×${roPortalHits}`,
      `h1:"${h1.trim().slice(0, 40)}"`,
      seeNote,
    ]
      .filter(Boolean)
      .join(" · ");
    results.push({
      route,
      theme,
      w,
      file: name,
      overflow,
      consoleErrors: [...consoleErrors],
      axeViolations,
      axeIds,
      roPortalHits,
      h1: h1.trim(),
      see,
      scrollBottom: !!scrollBottom,
    });
    evidence[name] = see;
    console.log("wrote", name, "—", see);
  }

  for (const r of mainRoutes) {
    for (const c of combos) {
      await capture({ ...r, ...c, scrollBottom: false });
    }
  }

  // Scroll-bottom proofs: light+dark @390 fixed viewport
  for (const r of proofRoutes) {
    for (const theme of ["light", "dark"]) {
      await capture({
        ...r,
        theme,
        w: 390,
        h: 844,
        scrollBottom: true,
      });
    }
  }

  await context.close();
}

const gates = {
  overflowFail: results.filter((r) => !r.overflow?.ok).map((r) => r.file),
  consoleFail: results.filter((r) => r.consoleErrors?.length).map((r) => r.file),
  axeFail: results
    .filter((r) => r.axeViolations > 0)
    .map((r) => ({ file: r.file, n: r.axeViolations, ids: r.axeIds })),
  roPortalFail: results
    .filter((r) => (r.roPortalHits || 0) > 0)
    .map((r) => ({ file: r.file, n: r.roPortalHits })),
};

const manifest = {
  at: new Date().toISOString(),
  base: BASE,
  evidence,
  gates,
  results,
  files: fs
    .readdirSync(OUT)
    .filter((f) => f.startsWith("r91-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "r91-shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ gates, files: manifest.files.length }, null, 2));
await browser.close();

const hardFail =
  gates.overflowFail.length ||
  gates.consoleFail.length ||
  gates.axeFail.length ||
  gates.roPortalFail.length;
process.exit(hardFail ? 1 : 0);
