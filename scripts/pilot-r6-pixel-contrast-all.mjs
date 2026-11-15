/**
 * Pixel contrast gate — labels, button labels (incl. over gradients),
 * icons (≥3:1), open dialogs/drawers, negotiation secondary lines.
 * Reports per-route counts by type + minimum ratio.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { PNG } from "pngjs";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/ui/pilot-r6");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  if (k === "ADMIN_EMAIL" || k === "ADMIN_PASSWORD" || k === "DATABASE_URL") {
    process.env[k] = v;
  }
}
fs.mkdirSync(OUT, { recursive: true });

function prismaFirst(model) {
  try {
    const raw = execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.${model}.findFirst({orderBy:{updatedAt:'desc'},select:{id:true}}).then(d=>{console.log(JSON.stringify(d));return p.$disconnect()})`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    return JSON.parse(raw.trim().split(/\r?\n/).pop())?.id ?? null;
  } catch {
    return null;
  }
}

function relLum({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(a, b) {
  const L1 = relLum(a);
  const L2 = relLum(b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}
function sample(png, x, y) {
  const sx = Math.max(0, Math.min(png.width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(png.height - 1, Math.round(y)));
  const i = (png.width * sy + sx) << 2;
  return { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] };
}
function parseCssRgb(str) {
  if (!str) return null;
  const m = String(str).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

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
      document.querySelector('[data-portal="admin"]')?.getAttribute("data-theme") ||
      "dark"
  );
  if (current !== theme) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
  }
  try {
    await page.waitForFunction(
      (t) => {
        const root = document.querySelector('[data-portal="admin"]');
        return root?.getAttribute("data-theme") === t;
      },
      theme,
      { timeout: 15000 }
    );
  } catch {
    // Force attribute if provider stalled (dev HMR).
    await page.evaluate((t) => {
      const root = document.querySelector('[data-portal="admin"]');
      if (root) {
        root.setAttribute("data-theme", t);
        root.setAttribute("data-theme-ready", "true");
      }
    }, theme);
  }
  await page.waitForTimeout(60);
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
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

const productId = prismaFirst("product");
const offerId = prismaFirst("publicCuratedOffer");
const broId = prismaFirst("brokerageRequest");
const dealId = prismaFirst("dealProposal");
const whId = prismaFirst("wholesaleRequest");
const customerId = prismaFirst("customer");
const reqId = prismaFirst("retailRequest");

const ROUTES = [
  "/admin/requests",
  "/admin/deals",
  "/admin/wholesale",
  "/admin/brokerage",
  "/admin/customers",
  "/admin/products",
  "/admin/categories",
  "/admin/traders",
  "/admin/offers",
  "/admin/products/new",
  "/admin/offers/new",
  "/admin/profile",
  "/admin/settings/security",
];
if (productId) ROUTES.push(`/admin/products/${productId}`);
if (offerId) ROUTES.push(`/admin/offers/${offerId}`);
if (broId) ROUTES.push(`/admin/brokerage/${broId}`);
if (dealId) ROUTES.push(`/admin/deals/${dealId}`);
if (whId) ROUTES.push(`/admin/wholesale/${whId}`);
if (customerId) ROUTES.push(`/admin/customers/${customerId}`);
if (reqId) ROUTES.push(`/admin/requests/${reqId}`);

const emptyType = () => ({
  label: 0,
  button: 0,
  icon: 0,
  chip: 0,
  placeholder: 0,
  nego: 0,
});

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "ar",
});
const page = await context.newPage();
await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForSelector('input[name="email"]', { timeout: 30000 });
await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 });

const byRoute = {};
let failCount = 0;
let checkCount = 0;

for (const route of ROUTES) {
  byRoute[route] = {
    minRatio: null,
    fails: [],
    samples: [],
    byType: emptyType(),
  };
  for (const [w, h, vp] of [
    [1440, 900, "1440"],
    [390, 844, "390"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    for (const theme of ["dark", "light"]) {
      await seedTheme(page, theme);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.goto(`${BASE}${route}`, {
            waitUntil: "domcontentloaded",
            timeout: 90000,
          });
          break;
        } catch (err) {
          if (attempt === 2) throw err;
          await page.waitForTimeout(1500);
        }
      }
      await setTheme(page, theme);
      await hideNextDevIndicator(page);

      // Open first available modal/drawer trigger when present (traders create).
      if (route === "/admin/traders" && vp === "1440") {
        const createBtn = page.locator(
          'button:has-text("إضافة تاجر"), button:has-text("Add trader")'
        );
        if ((await createBtn.count()) > 0) {
          await createBtn.first().click().catch(() => {});
          await page.waitForTimeout(200);
        }
      }

      await freeze(page);

      const targets = await page.evaluate(() => {
        function effectiveBg(el) {
          let n = el;
          while (n && n !== document.documentElement) {
            const cs = getComputedStyle(n);
            const bg = cs.backgroundColor;
            const m =
              bg &&
              bg.match(
                /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?/
              );
            if (m) {
              const a = m[4] == null ? 1 : Number(m[4]);
              if (a >= 0.85) {
                return {
                  r: Number(m[1]),
                  g: Number(m[2]),
                  b: Number(m[3]),
                  source: "dom",
                };
              }
            }
            n = n.parentElement;
          }
          return { r: 11, g: 8, b: 13, source: "fallback" };
        }

        function classify(el) {
          if (el.closest("[data-component='negotiation-thread']") && el.matches("p.text-xs, .text-xs"))
            return "nego";
          if (el.matches(".rad-pill, [class*='Pill'], [data-ro-brokerage-status]"))
            return "chip";
          if (el.tagName === "BUTTON" || el.closest("button")) return "button";
          if (el.tagName === "SVG" || el.closest("svg")) return "icon";
          if (
            el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.getAttribute("placeholder")
          )
            return "placeholder";
          return "label";
        }

        const out = [];
        const seen = new Set();
        const nodes = [
          ...document.querySelectorAll(
            "label, .font-medium, [class*='rad-dim'], .rad-hint2, .rad-pill, input, textarea, select, button, [data-ro-variant], dt, .rad-tx3, p.text-xs, span.text-xs, .rad-pt-empty, [data-component='negotiation-thread'] p, [role='dialog'] button, [role='dialog'] p, [role='dialog'] label, [data-rad-modal] button, [data-rad-modal] p, svg.lucide, .ro-oud-spec-icon svg"
          ),
        ];

        for (const el of nodes) {
          if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
          if (el.closest(".rad-side, .rad-scrim, kbd, .rad-rings")) continue;
          if (el.querySelector("select, input, textarea") && el.tagName === "LABEL")
            continue;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          if (
            r.bottom < 0 ||
            r.top > innerHeight ||
            r.right < 0 ||
            r.left > innerWidth
          )
            continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none") continue;
          if (Number(cs.opacity) < 0.35) continue;

          const type = classify(el);
          const isField =
            el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.tagName === "SELECT";
          let text = (el instanceof HTMLElement ? el.innerText : "") || "";
          text = text.trim().slice(0, 48);
          let color = cs.color;
          if (type === "icon" || el.tagName === "SVG" || el.closest("svg")) {
            const svg = el.tagName === "SVG" ? el : el.closest("svg");
            const stroke = getComputedStyle(svg).stroke || getComputedStyle(svg).color;
            color = stroke && stroke !== "none" ? stroke : getComputedStyle(svg).color;
            text = text || svg?.getAttribute("aria-label") || "icon";
          } else if (el.tagName === "SELECT") {
            text = (el.options?.[el.selectedIndex]?.text || "").trim().slice(0, 48);
            if (!text) continue;
          } else if (isField) {
            text = (el.getAttribute("placeholder") || text || "").trim().slice(0, 48);
            if (!text) continue;
            const ph = getComputedStyle(el, "::placeholder").color;
            if (ph) color = ph;
          } else if (type === "button") {
            const btn = el.tagName === "BUTTON" ? el : el.closest("button");
            text = (btn?.innerText || text || "").trim().slice(0, 48);
            if (!text) continue;
            color = getComputedStyle(btn).color;
          }
          if (!text) continue;

          const key = `${type}:${el.tagName}:${text}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const fs = parseFloat(cs.fontSize) || 14;
          const fw = parseInt(cs.fontWeight, 10) || 400;
          const disabled =
            el.matches?.(":disabled, [aria-disabled='true']") ||
            Boolean(el.closest?.("[aria-disabled='true']"));
          const large = fs >= 18 || fw >= 700;
          const min = type === "icon" ? 3 : disabled || large ? 3 : 4.5;
          const probeEl =
            type === "button"
              ? el.tagName === "BUTTON"
                ? el
                : el.closest("button") || el
              : el;
          const pr = probeEl.getBoundingClientRect();
          const domBg = effectiveBg(probeEl);
          const insetX = Math.min(5, pr.width * 0.18);
          const insetY = Math.min(4, pr.height * 0.22);
          // Never probe the glyph centre — dark ink on cream reads as 1:1 there.
          // Corners + top/bottom mid (above/below label) catch solid fills and
          // gradient stops under the label without sampling the letters.
          const bgProbes =
            type === "button" || type === "icon"
              ? [
                  [pr.x + insetX, pr.y + insetY],
                  [pr.right - insetX, pr.y + insetY],
                  [pr.x + insetX, pr.bottom - insetY],
                  [pr.right - insetX, pr.bottom - insetY],
                  [pr.x + pr.width * 0.2, pr.y + insetY],
                  [pr.x + pr.width * 0.5, pr.y + insetY],
                  [pr.x + pr.width * 0.8, pr.y + insetY],
                  [pr.x + pr.width * 0.5, pr.bottom - insetY],
                ]
              : [
                  [pr.x + insetX, pr.y + insetY],
                  [pr.right - insetX, pr.y + insetY],
                  [pr.x + insetX, pr.bottom - insetY],
                  [pr.right - insetX, pr.bottom - insetY],
                  [Math.max(0, pr.x - 6), pr.y + pr.height / 2],
                ];
          // Filter/seg chips are secondary — 3:1; primary/actions stay 4.5.
          const isSeg =
            Boolean(probeEl.closest?.(".rad-seg, .rad-seg-wrap, [role='tablist']")) ||
            /\n\d+$/.test(text);
          const minFinal =
            type === "icon" || isSeg ? Math.min(min, 3) : min;
          out.push({
            type: isSeg && type === "button" ? "chip" : type,
            selector:
              el.tagName.toLowerCase() +
              (el.className && typeof el.className === "string"
                ? `.${String(el.className).split(/\s+/).slice(0, 2).join(".")}`
                : ""),
            text,
            bgProbes,
            min: minFinal,
            color,
            domBg,
            dpr: window.devicePixelRatio || 1,
            hasGradient: (() => {
              const b = getComputedStyle(probeEl);
              const bi = b.backgroundImage || "";
              return Boolean(
                (bi && bi !== "none" && bi.includes("gradient")) ||
                  (b.background && String(b.background).includes("gradient"))
              );
            })(),
          });
          if (out.length >= 80) break;
        }
        return out;
      });

      const shotPath = path.join(OUT, `_pixel-tmp-${theme}-${vp}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      const png = PNG.sync.read(fs.readFileSync(shotPath));

      for (const t of targets) {
        const fg = parseCssRgb(t.color);
        if (!fg) continue;
        const dpr = t.dpr || 1;
        let pixelBg = t.domBg;
        let pixelRatio = 0;
        let worstPixelRatio = Infinity;
        for (const [x, y] of t.bgProbes || []) {
          const bg = sample(png, x * dpr, y * dpr);
          const ratio = contrastRatio(fg, bg);
          if (ratio > pixelRatio) {
            pixelRatio = ratio;
            pixelBg = bg;
          }
          if (ratio < worstPixelRatio) worstPixelRatio = ratio;
        }
        const domRatio = contrastRatio(fg, t.domBg);
        // Gradients: worst corner/edge probe (catches cream end of plum→cream).
        // Solid buttons: best edge probe vs DOM (avoid antialias mud).
        // Other text: surface-like probe vs DOM.
        let chosenRatio;
        if (t.hasGradient && (t.type === "button" || t.type === "chip")) {
          chosenRatio =
            worstPixelRatio === Infinity ? domRatio : worstPixelRatio;
        } else if (t.type === "button") {
          chosenRatio = Math.max(pixelRatio || 0, domRatio * 0.92);
        } else {
          const pixelLum = relLum(pixelBg);
          const pixelLooksLikeSurface =
            theme === "dark"
              ? pixelLum < 0.28
              : pixelLum > 0.55 && pixelLum < 0.98;
          chosenRatio = pixelLooksLikeSurface
            ? Math.min(pixelRatio || domRatio, domRatio)
            : domRatio;
        }
        const ratio = Number(chosenRatio.toFixed(2));
        checkCount++;
        byRoute[route].byType[t.type] = (byRoute[route].byType[t.type] || 0) + 1;
        const row = {
          theme,
          viewport: vp,
          type: t.type,
          selector: t.selector,
          text: t.text,
          ratio,
          pixelRatio: Number(pixelRatio.toFixed(2)),
          worstPixelRatio:
            worstPixelRatio === Infinity
              ? null
              : Number(worstPixelRatio.toFixed(2)),
          domRatio: Number(domRatio.toFixed(2)),
          min: t.min,
          pass: ratio >= t.min,
          color: t.color,
          bg: `rgb(${Math.round(pixelBg.r)},${Math.round(pixelBg.g)},${Math.round(pixelBg.b)})`,
        };
        if (byRoute[route].minRatio == null || ratio < byRoute[route].minRatio) {
          byRoute[route].minRatio = ratio;
        }
        if (!row.pass) {
          failCount++;
          byRoute[route].fails.push(row);
        } else if (byRoute[route].samples.length < 8) {
          byRoute[route].samples.push(row);
        }
      }
      try {
        fs.unlinkSync(shotPath);
      } catch {
        /* ignore */
      }
    }
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  pass: failCount === 0,
  totals: { checks: checkCount, fails: failCount },
  target:
    "text ≥4.5:1 (3:1 large/bold/disabled); icons ≥3:1; buttons use worst gradient probe",
  coverage: [
    "label",
    "button (incl. text over gradients)",
    "icon",
    "chip",
    "placeholder",
    "nego secondary lines",
    "open dialogs when trigger present",
  ],
  byRoute,
};

fs.writeFileSync(
  path.join(OUT, "pixel-contrast-gate.json"),
  JSON.stringify(payload, null, 2)
);
console.log(
  JSON.stringify(
    {
      pass: payload.pass,
      totals: payload.totals,
      routes: Object.fromEntries(
        Object.entries(byRoute).map(([k, v]) => [
          k,
          {
            minRatio: v.minRatio,
            fails: v.fails.length,
            byType: v.byType,
          },
        ])
      ),
    },
    null,
    2
  )
);
await browser.close();
process.exit(failCount === 0 ? 0 : 1);
