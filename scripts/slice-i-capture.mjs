/**
 * Slice I — trader PARTIAL screens. AR only, exact viewport widths.
 * Usage: node scripts/slice-i-capture.mjs [baseUrl]
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "ui-planning", "screenshots", "slice-i");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 768, h: 1024, tag: "768" },
  { w: 390, h: 844, tag: "390" },
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

async function hideDevChrome(send) {
  await send("Runtime.evaluate", {
    expression: `(() => {
      const id = "ro-hide-dev-indicator";
      if (!document.getElementById(id)) {
        const s = document.createElement("style");
        s.id = id;
        s.textContent = "nextjs-portal,#__nextjs-dev-indicator,[data-next-badge-root],[data-nextjs-toast],#__next-build-watcher{display:none!important;visibility:hidden!important;pointer-events:none!important}";
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

async function authTrader(send, token, locale) {
  await setLocale(send, locale);
  await send("Network.setCookie", {
    name: "ro_trader_session",
    value: token,
    url: BASE,
    httpOnly: true,
    sameSite: "Lax",
  });
}

async function clearAuth(send, locale) {
  await setLocale(send, locale);
  await send("Network.deleteCookies", { name: "ro_trader_session" }).catch(
    () => {}
  );
}

async function shot(send, file) {
  await hideDevChrome(send);
  const r = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, "base64"));
  console.log("wrote", file);
}

async function main() {
  // Ensure demo waiting deal reference is visible (rename legacy seed ref)
  try {
    execFileSync(
      process.execPath,
      [
        "-e",
        `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.dealProposal.updateMany({where:{reference:'DL-SEED-WAIT'},data:{reference:'DL-DEMO-WAIT'}}).then(r=>console.log('renamed',r.count)).finally(()=>p.$disconnect())`,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
  } catch {
    /* ignore */
  }

  const sessions = mint();
  fs.mkdirSync(OUT, { recursive: true });

  const routes = [
    { path: "/trader/login", file: "login", auth: false },
    { path: "/trader", file: "home", auth: true },
    { path: "/trader/deals", file: "deals", auth: true },
    {
      path: sessions.waitingDealId
        ? `/trader/deals/${sessions.waitingDealId}`
        : "/trader/deals",
      file: "deal-detail-waiting",
      auth: true,
    },
    { path: "/trader/wholesale/requests", file: "wholesale-list", auth: true },
    {
      path: sessions.wholesaleId
        ? `/trader/wholesale/${sessions.wholesaleId}`
        : "/trader/wholesale",
      file: "wholesale-detail",
      auth: true,
    },
    { path: "/trader/offers", file: "offers", auth: true },
    { path: "/trader/profile", file: "profile", auth: true },
  ];

  const port = 9362;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-i-cap-"));
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

        for (const vp of VIEWPORTS) {
          await send("Emulation.setDeviceMetricsOverride", {
            width: vp.w,
            height: vp.h,
            deviceScaleFactor: 1,
            mobile: vp.w <= 390,
          });
          await send("Emulation.setEmulatedMedia", {
            features: [{ name: "prefers-reduced-motion", value: "reduce" }],
          });

          for (const route of routes) {
            if (route.auth) {
              await authTrader(send, sessions.trader, "ar");
            } else {
              await clearAuth(send, "ar");
            }
            await send("Page.navigate", { url: `${BASE}${route.path}` });
            await sleep(2200);
            await shot(send, `${route.file}-ar-${vp.tag}.png`);
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

  console.log(
    "slice-i done",
    JSON.stringify({
      waitingDealRef: sessions.waitingDealRef,
      traderEmail: sessions.traderEmail,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
