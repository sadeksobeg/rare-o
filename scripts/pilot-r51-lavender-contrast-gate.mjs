/**
 * Round 5.1 — fail lavender fill (#4c4666) and WCAG contrast on admin routes.
 * Color distance: Euclidean RGB vs #4c4666, threshold 6 (ΔE proxy; not CIEDE2000).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hideNextDevIndicator } from "./pilot-hide-next-indicator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs/ui/pilot-r6");
const OUT = path.join(OUT_DIR, "lavender-contrast-gate.json");
const OUT_R51 = path.join(ROOT, "docs/ui/pilot-r51", "lavender-contrast-gate.json");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

const LAVENDER = { r: 76, g: 70, b: 102, hex: "#4c4666" };
const COLOR_DIST_TOL = 6;

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (
      !(k in process.env) ||
      !process.env[k] ||
      k.startsWith("ADMIN_") ||
      k === "DATABASE_URL"
    ) {
      process.env[k] = v;
    }
  }
}
loadDotEnv();
fs.mkdirSync(OUT_DIR, { recursive: true });

const LIST_ROUTES = [
  "/admin/requests",
  "/admin/deals",
  "/admin/wholesale",
  "/admin/brokerage",
  "/admin/customers",
  "/admin/products",
  "/admin/categories",
  "/admin/traders",
  "/admin/offers",
];

const DETAIL_LINKS = [
  { list: "/admin/requests", sel: 'a[href^="/admin/requests/"]', key: "request-detail" },
  { list: "/admin/deals", sel: 'a[href^="/admin/deals/"]', key: "deal-detail" },
  { list: "/admin/wholesale", sel: 'a[href^="/admin/wholesale/"]', key: "wholesale-detail" },
  { list: "/admin/brokerage", sel: 'a[href^="/admin/brokerage/"]', key: "brokerage-detail" },
  { list: "/admin/customers", sel: 'a[href^="/admin/customers/"]', key: "customer-detail" },
  { list: "/admin/products", sel: 'a[href^="/admin/products/"]', key: "product-detail" },
  { list: "/admin/offers", sel: 'a[href^="/admin/offers/"]', key: "offer-detail" },
  { list: "/admin/traders", sel: 'a[href^="/admin/traders/"]', key: "trader-detail" },
];

function rgbDist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function parseRgb(s) {
  const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}

function relLum({ r, g, b }) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(fg, bg) {
  const L1 = relLum(fg);
  const L2 = relLum(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    try {
      localStorage.setItem("ro-portal-theme-v5", t);
    } catch {
      /* ignore */
    }
  }, theme);
  const current = await page.evaluate(() => {
    const root = document.querySelector('[data-portal="admin"]');
    return root?.getAttribute("data-theme") || "dark";
  });
  if (current !== theme) {
    const themeBtn = page.locator(".rad-top button[aria-pressed]");
    if ((await themeBtn.count()) > 0) await themeBtn.first().click();
  }
  await page.waitForFunction(
    (t) => {
      const root = document.querySelector('[data-portal="admin"]');
      return root?.getAttribute("data-theme") === t;
    },
    theme,
    { timeout: 10000 }
  );
}

async function login(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', process.env.ADMIN_EMAIL);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
}

async function scanPage(page) {
  return page.evaluate(
    ({ lavender, colorDistTol }) => {
      function parseRgb(s, under = { r: 11, g: 8, b: 13 }) {
        const m = String(s).match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i
        );
        if (!m) return null;
        const a = m[4] == null ? 1 : Number(m[4]);
        if (a <= 0.02) return null;
        const r = +m[1];
        const g = +m[2];
        const b = +m[3];
        if (a >= 0.99) return { r, g, b };
        // Blend translucent fills onto parent so pill soft-tints aren't solid false-pos.
        return {
          r: Math.round(r * a + under.r * (1 - a)),
          g: Math.round(g * a + under.g * (1 - a)),
          b: Math.round(b * a + under.b * (1 - a)),
        };
      }
      function rgbDist(a, b) {
        return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
      }
      function relLum({ r, g, b }) {
        const f = (c) => {
          c /= 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      }
      function contrastRatio(fg, bg) {
        const L1 = relLum(fg);
        const L2 = relLum(bg);
        return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      }
      function effectiveBg(el) {
        const stack = [];
        let node = el;
        while (node && node instanceof Element) {
          stack.push(node);
          node = node.parentElement;
        }
        const root = document.querySelector('[data-portal="admin"]') || document.body;
        let under =
          parseRgb(getComputedStyle(root).backgroundColor) || {
            r: 11,
            g: 8,
            b: 13,
          };
        // Paint ancestors first so translucent pill fills blend correctly.
        for (let i = stack.length - 1; i >= 0; i--) {
          const cs = getComputedStyle(stack[i]);
          const bg = parseRgb(cs.backgroundColor, under);
          if (bg) under = bg;
        }
        return under;
      }

      const lavenderHits = [];
      const contrastFails = [];
      const seen = new Set();

      const candidates = [
        ...document.querySelectorAll(
          'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]), textarea, select, button, [class*="rad-"], [class*="pill"], label, p, span, td, th, h1, h2, h3, .rad-pt-empty, .rad-sk, .ro-skeleton, [data-rad-skeleton], [role="dialog"], [aria-modal="true"]'
        ),
      ];
      // Explicit placeholder / empty-image tiles (lavender leak surface).
      for (const el of document.querySelectorAll(
        ".rad-pt-empty, [class*='MaterialPlate'], [class*='material-plate'], .rad-sk, .ro-skeleton"
      )) {
        candidates.push(el);
      }

      for (const el of candidates) {
        if (!(el instanceof HTMLElement)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        // Off-screen (closed mobile drawer) — skip false positives.
        if (
          r.bottom < 0 ||
          r.top > window.innerHeight ||
          r.right < 0 ||
          r.left > window.innerWidth
        )
          continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        if (el.closest(".rad-scrim")) continue;

        const bg = parseRgb(cs.backgroundColor);
        if (bg) {
          const d = rgbDist(bg, lavender);
          if (d < colorDistTol) {
            lavenderHits.push({
              tag: el.tagName.toLowerCase(),
              class: el.className?.toString?.().slice(0, 80) || "",
              bg: cs.backgroundColor,
              dist: Number(d.toFixed(2)),
            });
          }
        }
        // Gradients / background-image — catch lavender tiles (#4c4666 family)
        // and plum→cream primary leftovers. Skip intentional brand avatars.
        const bi = cs.backgroundImage || "";
        if (
          bi &&
          bi !== "none" &&
          !el.closest(".rad-av, .rad-uk-avt, .avt, [class*='avatar']")
        ) {
          const hexHits = bi.match(/#([0-9a-fA-F]{3,8})/g) || [];
          const rgbHits = [
            ...bi.matchAll(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/g),
          ];
          const stops = [];
          for (const h of hexHits) {
            let hex = h.slice(1);
            if (hex.length === 3)
              hex = hex
                .split("")
                .map((c) => c + c)
                .join("");
            if (hex.length >= 6) {
              stops.push({
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
              });
            }
          }
          for (const m of rgbHits) {
            stops.push({ r: +m[1], g: +m[2], b: +m[3] });
          }
          const cream = { r: 244, g: 231, b: 216 };
          for (const stop of stops) {
            const d = rgbDist(stop, lavender);
            // Near #4c4666 only (not brand accent #7A44B3 / #32104F avatars).
            if (d < colorDistTol + 18) {
              lavenderHits.push({
                tag: el.tagName.toLowerCase(),
                class: el.className?.toString?.().slice(0, 80) || "",
                bg: bi.slice(0, 120),
                dist: Number(d.toFixed(2)),
                via: "background-image",
              });
              break;
            }
            // Plum→cream primary leftover: stop near cream AND another stop
            // in mid plum while element is a primary button.
            const nearCream = rgbDist(stop, cream) < 28;
            if (
              nearCream &&
              el.closest('[data-ro-variant="primary"]') &&
              stops.some((s) => s.b > s.g && s.r > 70 && s.r < 160)
            ) {
              lavenderHits.push({
                tag: el.tagName.toLowerCase(),
                class: el.className?.toString?.().slice(0, 80) || "",
                bg: bi.slice(0, 120),
                dist: Number(d.toFixed(2)),
                via: "background-image-primary-gradient",
              });
              break;
            }
          }
        }

        // Leaf-ish text only: skip containers that wrap other labeled children.
        if (el.children.length > 2) continue;
        if (cs.opacity === "0" || Number(cs.opacity) < 0.35) continue;
        // Sidebar chrome / decorative kbd hints are covered by dedicated a11y tests.
        if (el.closest(".rad-side, .rad-sb, kbd, .rad-rings, .rad-uk-avt, .rad-avt, .avt"))
          continue;
        // Nested spans inside buttons are covered via the button itself.
        if (
          el.tagName !== "BUTTON" &&
          el.closest(
            '[data-ro-variant="primary"], [data-ro-variant="inverse-primary"], [data-ro-variant="danger"]'
          )
        )
          continue;
        // Modal scrim itself is not body copy.
        if (el.matches("[data-rad-modal-scrim], .rad-mo")) continue;
        // Single-letter avatar glyphs / status dots are not body copy.
        if ((el.innerText || "").trim().length <= 1) continue;

        const text = (el.innerText || el.textContent || "").trim();
        if (!text || text.length > 120) continue;
        const key = `${el.tagName}:${text.slice(0, 40)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const fg = parseRgb(cs.color);
        if (!fg) continue;
        // Prefer the control/dialog's own opaque fill over backdrop/scrim walks.
        let back = null;
        const own = parseRgb(cs.backgroundColor);
        if (own && (() => {
          const m = String(cs.backgroundColor).match(/rgba?\([^)]+?,\s*([\d.]+)\s*\)/);
          return !m || Number(m[1]) >= 0.85;
        })()) {
          back = own;
        } else {
          const dlg = el.closest("dialog[open]");
          if (dlg) {
            const dcs = getComputedStyle(dlg);
            const dbg = parseRgb(dcs.backgroundColor);
            if (dbg) back = dbg;
          }
        }
        if (!back) back = effectiveBg(el);
        const ratio = contrastRatio(fg, back);
        const fs = parseFloat(cs.fontSize) || 16;
        const fw = parseInt(cs.fontWeight, 10) || 400;
        const min = fs >= 18 || fw >= 700 ? 3 : 4.5;
        if (ratio < min) {
          contrastFails.push({
            tag: el.tagName.toLowerCase(),
            text: text.slice(0, 80),
            ratio: Number(ratio.toFixed(2)),
            min,
            color: cs.color,
            bg: `rgb(${back.r},${back.g},${back.b})`,
          });
        }
      }

      return { lavenderHits, contrastFails };
    },
    { lavender: LAVENDER, colorDistTol: COLOR_DIST_TOL }
  );
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "ar" })).newPage();
await login(page);

const byRoute = {};
let totalLavender = 0;
let totalContrast = 0;

const paths = [...LIST_ROUTES];
for (const d of DETAIL_LINKS) {
  await page.goto(`${BASE}${d.list}`, { waitUntil: "networkidle", timeout: 60000 });
  const href = await page.evaluate((sel) => {
    const a = [...document.querySelectorAll(sel)].find((el) => {
      const h = el.getAttribute("href") || "";
      return h.split("/").filter(Boolean).length >= 3;
    });
    return a?.getAttribute("href") || null;
  }, d.sel);
  if (href) paths.push(href);
}

for (const routePath of paths) {
  byRoute[routePath] = { lavender: 0, contrast: 0, samples: [] };
  for (const [w, h, vp] of [
    [1440, 900, "1440"],
    [390, 844, "390"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    for (const theme of ["dark", "light"]) {
      await page.goto(`${BASE}${routePath}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await setTheme(page, theme);
      await hideNextDevIndicator(page);
      await page.waitForTimeout(250);
      const { lavenderHits, contrastFails } = await scanPage(page);
      byRoute[routePath].lavender += lavenderHits.length;
      byRoute[routePath].contrast += contrastFails.length;
      totalLavender += lavenderHits.length;
      totalContrast += contrastFails.length;
      if (lavenderHits.length || contrastFails.length) {
        byRoute[routePath].samples.push({
          theme,
          viewport: vp,
          lavenderHits: lavenderHits.slice(0, 12),
          contrastFails: contrastFails.slice(0, 12),
        });
      }

      // Open create / primary dialogs when present (traders / categories).
      if (routePath === "/admin/traders" || routePath === "/admin/categories") {
        const openBtn = page
          .getByRole("button", { name: /إنشاء|جديد|Create|New|تاجر|فئة/i })
          .first();
        if ((await openBtn.count()) > 0) {
          await openBtn.click().catch(() => {});
          await page.waitForTimeout(350);
          const modalScan = await scanPage(page);
          const key = `${routePath}#modal-open`;
          if (!byRoute[key]) byRoute[key] = { lavender: 0, contrast: 0, samples: [] };
          byRoute[key].lavender += modalScan.lavenderHits.length;
          byRoute[key].contrast += modalScan.contrastFails.length;
          totalLavender += modalScan.lavenderHits.length;
          totalContrast += modalScan.contrastFails.length;
          if (modalScan.lavenderHits.length || modalScan.contrastFails.length) {
            byRoute[key].samples.push({
              theme,
              viewport: vp,
              lavenderHits: modalScan.lavenderHits.slice(0, 12),
              contrastFails: modalScan.contrastFails.slice(0, 12),
            });
          }
          await page.keyboard.press("Escape").catch(() => {});
        }
      }
    }
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  pass: totalLavender === 0 && totalContrast === 0,
  formula: {
    lavender: `sqrt((R-76)²+(G-70)²+(B-102)²) < ${COLOR_DIST_TOL} vs ${LAVENDER.hex}`,
    contrast: "WCAG relative luminance; min 4.5:1 (3:1 if font≥18px or weight≥700)",
  },
  totals: { lavender: totalLavender, contrast: totalContrast },
  byRoute,
};

fs.mkdirSync(path.dirname(OUT_R51), { recursive: true });
const json = JSON.stringify(payload, null, 2);
fs.writeFileSync(OUT, json);
fs.writeFileSync(OUT_R51, json);
console.log(JSON.stringify({ pass: payload.pass, totals: payload.totals, byRoute: Object.fromEntries(
  Object.entries(byRoute).map(([k, v]) => [k, { lavender: v.lavender, contrast: v.contrast }])
) }, null, 2));
await browser.close();
process.exit(payload.pass ? 0 : 1);
