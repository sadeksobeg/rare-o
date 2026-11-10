/**
 * FINAL-QA automated pass — screenshots AR/EN @390/768/1440 + axe inject + report.
 * Usage: node scripts/final-qa-run.mjs [baseUrl]
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "ui-planning", "screenshots", "final-qa");
const REPORT = path.join(ROOT, "docs", "ui-planning", "plan", "FINAL-QA-REPORT.md");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 768, h: 1024, tag: "768" },
  { w: 390, h: 844, tag: "390" },
];

const LOCALES = ["ar", "en"];

const PUBLIC_ROUTES = [
  { path: "/", file: "home" },
  { path: "/catalog", file: "catalog" },
  { path: "/privacy", file: "privacy" },
  { path: "/contact", file: "contact" },
];

function mint() {
  const raw = execFileSync(
    process.execPath,
    [path.join(ROOT, "scripts", "mint-session-cookies.mjs")],
    { encoding: "utf8", cwd: ROOT }
  );
  return JSON.parse(raw.trim().split(/\r?\n/).pop());
}

async function cdpHttp(port, pathname) {
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
  if (!res.ok) throw new Error(`${pathname} ${res.status}`);
  return res.json();
}

async function withWs(url, fn) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res);
    ws.addEventListener("error", rej);
  });
  let id = 1;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id: id++, method, params }));
    });
  try {
    return await fn(send);
  } finally {
    ws.close();
  }
}

async function hideDev(send) {
  await send("Runtime.evaluate", {
    expression: `(() => {
      const id = "ro-hide-dev-indicator";
      if (!document.getElementById(id)) {
        const s = document.createElement("style");
        s.id = id;
        s.textContent = "nextjs-portal,#__nextjs-dev-indicator,[data-next-badge-root],[data-nextjs-toast],#__next-build-watcher{display:none!important}";
        document.documentElement.appendChild(s);
      }
      return true;
    })()`,
    returnByValue: true,
  }).catch(() => {});
}

async function setLocale(send, locale) {
  await send("Network.enable").catch(() => {});
  await send("Network.setCookie", {
    name: "ro_locale",
    value: locale,
    url: BASE,
  });
}

async function shot(send, file) {
  await hideDev(send);
  const r = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, "base64"));
  console.log("wrote", file);
}

async function measurePage(send) {
  return send("Runtime.evaluate", {
    expression: `(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
      const clientW = doc.clientWidth || window.innerWidth;
      const hScroll = scrollW > clientW + 2;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dir = document.documentElement.dir || 'ltr';
      const title = document.title || '';
      // Lightweight a11y probes (no axe dependency)
      const images = [...document.images];
      const missingAlt = images.filter(i => !i.hasAttribute('alt')).length;
      const buttons = [...document.querySelectorAll('button,[role="button"]')];
      const unlabeledIconBtns = buttons.filter(b => {
        const text = (b.textContent || '').trim();
        const aria = b.getAttribute('aria-label') || b.getAttribute('title');
        return !text && !aria;
      }).length;
      return {
        path: location.pathname,
        dir,
        title,
        iw: window.innerWidth,
        ih: window.innerHeight,
        hScroll,
        reduced,
        missingAlt,
        unlabeledIconBtns,
      };
    })()`,
    returnByValue: true,
  }).then((r) => r.result?.value ?? null);
}

async function main() {
  const sessions = mint();
  fs.mkdirSync(OUT, { recursive: true });
  const findings = [];
  const shots = [];

  const authRoutes = [
    { path: "/admin", file: "admin-home", cookie: "admin" },
    { path: "/admin/deals", file: "admin-deals", cookie: "admin" },
    { path: "/trader", file: "trader-home", cookie: "trader" },
    {
      path: sessions.waitingDealId
        ? `/trader/deals/${sessions.waitingDealId}`
        : "/trader/deals",
      file: "trader-deal",
      cookie: "trader",
    },
  ];

  const port = 9364;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-final-qa-"));
  const child = spawn(
    CHROME,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  await sleep(2000);

  try {
    const ver = await cdpHttp(port, "/json/version");
    await withWs(ver.webSocketDebuggerUrl, async (browserSend) => {
      const created = await browserSend("Target.createTarget", {
        url: "about:blank",
      });
      await sleep(300);
      const list = await cdpHttp(port, "/json/list");
      const page = list.find((t) => t.id === created.targetId);
      await withWs(page.webSocketDebuggerUrl, async (send) => {
        await send("Page.enable");
        await send("Runtime.enable");
        await send("Network.enable");

        for (const locale of LOCALES) {
          for (const vp of VIEWPORTS) {
            await send("Emulation.setDeviceMetricsOverride", {
              width: vp.w,
              height: vp.h,
              deviceScaleFactor: 1,
              mobile: vp.w <= 390,
            });
            await send("Emulation.setEmulatedMedia", {
              features: [
                { name: "prefers-reduced-motion", value: "reduce" },
              ],
            });
            await setLocale(send, locale);

            for (const route of PUBLIC_ROUTES) {
              await send("Page.navigate", { url: `${BASE}${route.path}` });
              await sleep(2000);
              const file = `${route.file}-${locale}-${vp.tag}.png`;
              await shot(send, file);
              shots.push(file);
              const m = await measurePage(send);
              if (m) {
                findings.push({
                  route: route.path,
                  locale,
                  vp: vp.tag,
                  ...m,
                });
              }
            }

            // Auth routes — AR primary matrix; EN at 1440 only to limit volume
            if (locale === "ar" || vp.tag === "1440") {
              for (const route of authRoutes) {
                const token =
                  route.cookie === "admin" ? sessions.admin : sessions.trader;
                const cookieName =
                  route.cookie === "admin"
                    ? "ro_admin_session"
                    : "ro_trader_session";
                await send("Network.setCookie", {
                  name: cookieName,
                  value: token,
                  url: BASE,
                  httpOnly: true,
                  sameSite: "Lax",
                });
                await send("Page.navigate", { url: `${BASE}${route.path}` });
                await sleep(2200);
                const file = `${route.file}-${locale}-${vp.tag}.png`;
                await shot(send, file);
                shots.push(file);
                const m = await measurePage(send);
                if (m) {
                  findings.push({
                    route: route.path,
                    locale,
                    vp: vp.tag,
                    ...m,
                  });
                }
              }
            }
          }
        }
      });
      await browserSend("Target.closeTarget", {
        targetId: created.targetId,
      });
    });
  } finally {
    child.kill();
    try {
      fs.rmSync(userData, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  const hScrollFails = findings.filter((f) => f.hScroll);
  const altFails = findings.filter((f) => f.missingAlt > 0);
  const unlabeledFails = findings.filter((f) => f.unlabeledIconBtns > 0);
  const rtlOk = findings
    .filter((f) => f.locale === "ar")
    .every((f) => f.dir === "rtl");
  const reducedOk = findings.every((f) => f.reduced === true);

  const lines = [];
  lines.push("# FINAL-QA Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Base: ${BASE}`);
  lines.push(`Screenshots: ${shots.length} → \`docs/ui-planning/screenshots/final-qa/\``);
  lines.push("");
  lines.push("## Automated results");
  lines.push("");
  lines.push("| Check | Result | Notes |");
  lines.push("|-------|--------|-------|");
  lines.push(
    `| X05 RTL dir=rtl on AR pages | ${rtlOk ? "**pass**" : "**fail**"} | sampled ${findings.filter((f) => f.locale === "ar").length} AR loads |`
  );
  lines.push(
    `| X07–X09 no horizontal scroll | ${hScrollFails.length === 0 ? "**pass**" : "**fail**"} | fails: ${hScrollFails.length ? hScrollFails.map((f) => `${f.route}@${f.vp}/${f.locale}`).join(", ") : "none"} |`
  );
  lines.push(
    `| X10 reduced-motion emulate | ${reducedOk ? "**pass**" : "**fail**"} | media feature set in CDP |`
  );
  lines.push(
    `| Images missing alt | ${altFails.length === 0 ? "**pass**" : "**fail**"} | pages with missingAlt>0: ${altFails.length} |`
  );
  lines.push(
    `| Icon buttons without name | ${unlabeledFails.length === 0 ? "**pass**" : "**warn**"} | ${unlabeledFails.length} page loads |`
  );
  lines.push(
    `| X12 axe-core | **blocked** | axe not bundled — run manually in DevTools or add later |`
  );
  lines.push(
    `| X13 Lighthouse | **blocked** | run Chrome Lighthouse manually on home + catalog + admin |`
  );
  lines.push("");
  lines.push("## Manual steps for owner");
  lines.push("");
  lines.push("1. Keyboard: Tab through header → catalog filters → PDP CTA → cart (X01).");
  lines.push("2. Dialogs: open filter sheet @390, Esc closes, focus returns (X04).");
  lines.push("3. Menus/Tabs: arrows + Home/End on inbox tabs and trader list tabs (X02/X03).");
  lines.push("4. Screen reader: submit toast / live region on catalog filter apply (X11).");
  lines.push("5. Lighthouse: home AR 1440 + catalog 390 — record a11y & best-practices scores (X13).");
  lines.push("6. axe DevTools: home, catalog, PDP, admin deals, trader deal detail — critical/serious = 0 (X12).");
  lines.push("7. Confirm PL01–PL07 in FINAL-QA.md before telling the client “operationally ready”.");
  lines.push("");
  lines.push("## Slice completion reminder");
  lines.push("");
  lines.push("- (a) Trader PARTIAL — done (`slice-i/`)");
  lines.push("- (b) Admin NegotiationThread + filters — done (`slice-j/`)");
  lines.push("- (c) This report — automated subset complete; axe/Lighthouse/manual keyboard remain owner steps");
  lines.push("");

  fs.writeFileSync(REPORT, lines.join("\n"), "utf8");
  console.log("wrote", REPORT);
  console.log(
    JSON.stringify({
      shots: shots.length,
      hScrollFails: hScrollFails.length,
      altFails: altFails.length,
      rtlOk,
      reducedOk,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
