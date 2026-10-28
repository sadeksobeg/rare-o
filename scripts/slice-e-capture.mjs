/**
 * Slice E screenshots — exact viewport widths, AR+EN, inbox + conversation.
 * Auth via minted JWT cookie (form login flaky in headless). Hides Next.js dev indicator.
 * Usage: node scripts/slice-e-capture.mjs [baseUrl]
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "ui-planning", "screenshots", "slice-e");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 768, h: 1024, tag: "768" },
  { w: 390, h: 844, tag: "390" },
];

function mint() {
  const raw = execFileSync(process.execPath, [path.join(ROOT, "scripts", "mint-session-cookies.mjs")], {
    encoding: "utf8",
    cwd: ROOT,
  });
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

async function auth(send, token, locale) {
  await send("Network.enable").catch(() => {});
  await send("Network.setCookie", {
    name: "ro_admin_session",
    value: token,
    url: BASE,
    httpOnly: true,
    sameSite: "Lax",
  });
  await send("Network.setCookie", {
    name: "ro_locale",
    value: locale,
    url: BASE,
  });
}

async function shot(send, file) {
  await hideDevChrome(send);
  const r = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, "base64"));
  const meta = await send("Runtime.evaluate", {
    expression: `JSON.stringify({iw:window.innerWidth,path:location.pathname})`,
    returnByValue: true,
  });
  console.log("wrote", file, meta.result?.value);
}

async function main() {
  const sessions = mint();
  fs.mkdirSync(OUT, { recursive: true });
  const port = 9356;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-e-cap-"));
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
      for (const locale of ["ar", "en"]) {
        const created = await browserSend("Target.createTarget", {
          url: "about:blank",
        });
        await sleep(300);
        const list = await cdpHttp(port, "/json/list");
        const page = list.find((t) => t.id === created.targetId);
        await withWs(page.webSocketDebuggerUrl, async (send) => {
          await send("Page.enable");
          await send("Runtime.enable");
          await auth(send, sessions.admin, locale);

          await send("Page.navigate", { url: `${BASE}/admin/inbox` });
          await sleep(2500);
          const convHref = await send("Runtime.evaluate", {
            expression: `document.querySelector('a[href^="/admin/inbox/"]')?.getAttribute('href') || ''`,
            returnByValue: true,
          });
          const threadPath = convHref.result.value || "/admin/inbox";

          for (const vp of VIEWPORTS) {
            await send("Emulation.setDeviceMetricsOverride", {
              width: vp.w,
              height: vp.h,
              deviceScaleFactor: 1,
              mobile: false,
            });
            await send("Emulation.setEmulatedMedia", {
              features: [{ name: "prefers-reduced-motion", value: "reduce" }],
            });

            await send("Page.navigate", { url: `${BASE}/admin/inbox` });
            await sleep(2200);
            await shot(send, `inbox-${locale}-${vp.tag}.png`);

            await send("Page.navigate", { url: `${BASE}${threadPath}` });
            await sleep(2200);
            await shot(send, `thread-${locale}-${vp.tag}.png`);
          }
        });
        await browserSend("Target.closeTarget", {
          targetId: created.targetId,
        });
      }
    });
  } finally {
    child.kill();
    try {
      fs.rmSync(userData, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
