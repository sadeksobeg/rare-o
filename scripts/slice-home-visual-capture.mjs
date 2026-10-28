/**
 * Home visual polish — AR shots @390/768/1440 (hero + cream band).
 * Usage: node scripts/slice-home-visual-capture.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(
  ROOT,
  "docs",
  "ui-planning",
  "screenshots",
  "slice-home-visual"
);
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 768, h: 1024, tag: "768" },
  { w: 390, h: 844, tag: "390" },
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

async function shot(send, file, clip, beyond = false) {
  await hideDev(send);
  const params = {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: beyond,
  };
  if (clip) params.clip = clip;
  const r = await send("Page.captureScreenshot", params);
  fs.writeFileSync(path.join(OUT, file), Buffer.from(r.data, "base64"));
  console.log("wrote", file);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const port = 9361;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-hv-cap-"));
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

        for (const vp of VIEWPORTS) {
          await send("Emulation.setDeviceMetricsOverride", {
            width: vp.w,
            height: vp.h,
            deviceScaleFactor: 1,
            mobile: false,
          });
          // Keep motion ON so explode→assemble is visible in shots
          await send("Emulation.setEmulatedMedia", {
            features: [
              { name: "prefers-reduced-motion", value: "no-preference" },
            ],
          });
          await send("Page.navigate", {
            url: `${BASE}/?hv=${Date.now()}-${vp.tag}`,
          });

          const heroClipExpr = `(() => {
            const el = document.querySelector('[data-hero="resonance"]');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: Math.max(0,r.x), y: Math.max(0,r.y), width: r.width, height: r.height, scale: 1 };
          })()`;

          // Mid-explode (parts separated)
          await sleep(550);
          let heroClip = await send("Runtime.evaluate", {
            expression: heroClipExpr,
            returnByValue: true,
          });
          if (heroClip.result?.value) {
            await shot(
              send,
              `home-ar-${vp.tag}-hero-explode.png`,
              heroClip.result.value,
              true
            );
          }

          // Settled assembly
          await sleep(2200);
          await shot(send, `home-ar-${vp.tag}.png`);
          heroClip = await send("Runtime.evaluate", {
            expression: heroClipExpr,
            returnByValue: true,
          });
          if (heroClip.result?.value) {
            await shot(
              send,
              `home-ar-${vp.tag}-hero.png`,
              heroClip.result.value,
              true
            );
          }

          // Scroll into cream trust strip for motif visibility
          await send("Runtime.evaluate", {
            expression: `(() => {
              const el = document.querySelector('[data-home-section="trust"]') || document.querySelector('main section:nth-of-type(2)');
              el?.scrollIntoView({ block: 'start' });
              return true;
            })()`,
            returnByValue: true,
          });
          await sleep(600);
          await shot(send, `home-ar-${vp.tag}-cream.png`);
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
