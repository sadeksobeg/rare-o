/**
 * Round 9 — wholesale / brokerage / offers / notifications / profile
 * × light/dark × 1440/1280/768/390.
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
const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
  { w: 768, h: 1024 },
  { w: 390, h: 844 },
];
const THEMES = ["light", "dark"];

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
  await page
    .waitForFunction(
      () =>
        !document.querySelector(
          '[aria-busy="true"], .rad-sk, .ro-skeleton, [data-rad-skeleton]'
        ),
      { timeout: 20000 }
    )
    .catch(() => {});
  await page.waitForTimeout(350);
}

async function freeze(page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
  await page.evaluate(async () => {
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        /* ignore */
      }
    }
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    );
  });
}

async function sizeToDocument(page) {
  const h = await page.evaluate(() =>
    Math.min(
      16000,
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight || 0
      )
    )
  );
  const cur = page.viewportSize();
  await page.setViewportSize({
    width: cur?.width || 1440,
    height: Math.max(Math.ceil(h), cur?.height || 900),
  });
}

async function overflowCheck(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    // Intentional H-scroll regions (.rad-stp-scroll / .rad-br-rail-scroll) are
    // allowed to have scrollWidth > clientWidth; they must not expand the doc.
    const cards = [
      ...document.querySelectorAll(
        ".rad-card, .rad-dt, .rad-dh, [data-component]"
      ),
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

const allRoutes = [
  { route: "/trader/wholesale/requests", fileBase: "r9-trader-ws-requests" },
  { route: "/trader/wholesale", fileBase: "r9-trader-ws-new" },
  ...(wsId
    ? [{ route: `/trader/wholesale/${wsId}`, fileBase: "r9-trader-ws-detail" }]
    : []),
  { route: "/trader/brokerage", fileBase: "r9-trader-brokerage" },
  ...(brokerageId
    ? [
        {
          route: `/trader/brokerage/${brokerageId}`,
          fileBase: "r9-trader-brokerage-detail",
        },
      ]
    : []),
  { route: "/trader/offers", fileBase: "r9-trader-offers" },
  { route: "/trader/notifications", fileBase: "r9-trader-notifications" },
  { route: "/trader/profile", fileBase: "r9-trader-profile" },
];
const filter = (process.env.R9_FILTER || "").trim();
const routes = filter
  ? allRoutes.filter((r) => r.fileBase.includes(filter) || r.route.includes(filter))
  : allRoutes;

console.log("routes", routes.map((r) => r.route));

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

  for (const { route, fileBase } of routes) {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        consoleErrors.length = 0;
        await page.setViewportSize({ width: vp.w, height: vp.h });
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
        await sizeToDocument(page);
        const name = `${fileBase}-${theme}-${vp.w}-ar.png`;
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
          (await page.locator("h1").first().textContent().catch(() => "")) ||
          "";
        let seeNote = "layout settled; chrome matches ui-kit";
        if (!overflow.ok) seeNote = "visible overflow on doc/card";
        else if (axeViolations) seeNote = `axe:${axeIds.slice(0, 3).join(",")}`;
        else if (consoleErrors.length) seeNote = "console errors present";
        else if (roPortalHits > 0) seeNote = "legacy ro-portal classes remain";
        const see = [
          route,
          `${theme}@${vp.w}`,
          !overflow.ok ? "H-OVERFLOW" : null,
          consoleErrors.length ? `console×${consoleErrors.length}` : null,
          axeViolations ? `axe×${axeViolations}` : null,
          `ro-portal×${roPortalHits}`,
          `h1:"${h1.trim().slice(0, 36)}"`,
          seeNote,
        ]
          .filter(Boolean)
          .join(" · ");
        const meta = {
          route,
          theme,
          w: vp.w,
          file: name,
          overflow,
          consoleErrors: [...consoleErrors],
          axeViolations,
          axeIds,
          roPortalHits,
          h1: h1.trim(),
          see,
        };
        results.push(meta);
        evidence[name] = see;
        console.log("wrote", name, "—", see);
      }
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
    .filter((f) => f.startsWith("r9-") && f.endsWith(".png")),
};
fs.writeFileSync(path.join(OUT, "r9-shots.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ gates, files: manifest.files.length }, null, 2));
await browser.close();

const hardFail =
  gates.overflowFail.length ||
  gates.consoleFail.length ||
  gates.axeFail.length ||
  gates.roPortalFail.length;
process.exit(hardFail ? 1 : 0);
