/**
 * Slice G storefront screenshots — AR only, exact widths.
 * Usage: node scripts/slice-g-capture.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "ui-planning", "screenshots", "slice-g");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  { w: 390, h: 844, tag: "390" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1440, h: 900, tag: "1440" },
];

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
        s.textContent = "nextjs-portal,#__nextjs-dev-indicator,[data-next-badge-root]{display:none!important}";
        document.documentElement.appendChild(s);
      }
      return true;
    })()`,
    returnByValue: true,
  }).catch(() => {});
}

async function shot(send, file) {
  await hideDev(send);
  const r = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, "base64"));
  const meta = await send("Runtime.evaluate", {
    expression: `JSON.stringify({iw:innerWidth,path:location.pathname})`,
    returnByValue: true,
  });
  console.log("wrote", file, meta.result?.value);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const port = 9359;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-g-cap-"));
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
        await send("Network.setCookie", {
          name: "ro_locale",
          value: "ar",
          url: BASE,
        });

        // Resolve a product + offer slug first
        await send("Emulation.setDeviceMetricsOverride", {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await send("Page.navigate", { url: `${BASE}/catalog` });
        await sleep(2500);
        const productHref = await send("Runtime.evaluate", {
          expression: `document.querySelector('a[href*="/product/"]')?.getAttribute('href') || ''`,
          returnByValue: true,
        });
        const productPath = productHref.result?.value || "/catalog";

        await send("Page.navigate", { url: `${BASE}/offers` });
        await sleep(2000);
        const offerHref = await send("Runtime.evaluate", {
          expression: `document.querySelector('a[href*="/offers/"]')?.getAttribute('href') || ''`,
          returnByValue: true,
        });
        const offerPath = offerHref.result?.value || "/offers";

        for (const vp of VIEWPORTS) {
          await send("Emulation.setDeviceMetricsOverride", {
            width: vp.w,
            height: vp.h,
            deviceScaleFactor: 1,
            mobile: false,
          });

          // Catalog
          await send("Page.navigate", { url: `${BASE}/catalog` });
          await sleep(2200);
          await shot(send, `catalog-ar-${vp.tag}.png`);

          // Filter sheet open @390 only
          if (vp.tag === "390") {
            await send("Runtime.evaluate", {
              expression: `(() => {
                const btn = [...document.querySelectorAll('button')].find(b => /تصفية|Filter/i.test(b.textContent||''));
                btn?.click();
                return !!btn;
              })()`,
              returnByValue: true,
            });
            await sleep(900);
            await shot(send, `catalog-filtersheet-ar-390.png`);
          }

          // 404
          await send("Page.navigate", { url: `${BASE}/this-page-does-not-exist-ro` });
          await sleep(2000);
          await shot(send, `404-ar-${vp.tag}.png`);

          // Offer detail
          await send("Page.navigate", { url: `${BASE}${offerPath}` });
          await sleep(2200);
          await shot(send, `offer-ar-${vp.tag}.png`);

          // Request form (may be empty cart)
          await send("Page.navigate", { url: `${BASE}/request` });
          await sleep(2200);
          await shot(send, `request-ar-${vp.tag}.png`);

          // PDP
          await send("Page.navigate", { url: `${BASE}${productPath}` });
          await sleep(2500);
          await shot(send, `pdp-ar-${vp.tag}.png`);

          // Privacy
          await send("Page.navigate", { url: `${BASE}/privacy` });
          await sleep(2000);
          await shot(send, `privacy-ar-${vp.tag}.png`);
        }
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
