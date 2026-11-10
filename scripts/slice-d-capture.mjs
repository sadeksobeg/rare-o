/**
 * Capture Slice D screenshots at exact viewport widths (no new dependency).
 * Usage: node scripts/slice-d-capture.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "ui-planning", "screenshots", "slice-d");
const ADMIN_OUT = path.join(ROOT, "docs", "ui-planning", "screenshots", "slice-c");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const SHOTS = [
  { file: "home-ar-1440.png", url: `${BASE}/`, w: 1440, h: 900 },
  { file: "home-ar-768.png", url: `${BASE}/`, w: 768, h: 1024 },
  { file: "home-ar-390.png", url: `${BASE}/`, w: 390, h: 844 },
  { file: "home-en-1440.png", url: `${BASE}/en`, w: 1440, h: 900 },
  { file: "home-en-768.png", url: `${BASE}/en`, w: 768, h: 1024 },
  { file: "home-en-390.png", url: `${BASE}/en`, w: 390, h: 844 },
  {
    file: "home-ar-1440-hero.png",
    url: `${BASE}/`,
    w: 1440,
    h: 900,
    heroOnly: true,
  },
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

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(ADMIN_OUT, { recursive: true });
  const port = 9335;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-cap-"));
  const child = spawn(
    CHROME,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  await sleep(2000);
  try {
    const ver = await cdpHttp(port, "/json/version");
    await withWs(ver.webSocketDebuggerUrl, async (browserSend) => {
      for (const shot of SHOTS) {
        const created = await browserSend("Target.createTarget", {
          url: "about:blank",
        });
        await sleep(300);
        const list = await cdpHttp(port, "/json/list");
        const page = list.find((t) => t.id === created.targetId);
        await withWs(page.webSocketDebuggerUrl, async (send) => {
          await send("Page.enable");
          await send("Runtime.enable");
          await send("Emulation.setDeviceMetricsOverride", {
            width: shot.w,
            height: shot.h,
            deviceScaleFactor: 1,
            mobile: shot.w <= 400,
          });
          await send("Emulation.setEmulatedMedia", {
            features: [{ name: "prefers-reduced-motion", value: "reduce" }],
          });
          await send("Page.navigate", { url: shot.url });
          await sleep(2500);
          let clip;
          if (shot.heroOnly) {
            const evaled = await send("Runtime.evaluate", {
              expression: `(() => {
                const el = document.querySelector('[data-hero="resonance"]');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, window.innerHeight), scale: 1 };
              })()`,
              returnByValue: true,
            });
            clip = evaled.result.value;
          }
          const shotResult = await send("Page.captureScreenshot", {
            format: "png",
            fromSurface: true,
            captureBeyondViewport: false,
            ...(clip ? { clip } : {}),
          });
          const dest = path.join(OUT, shot.file);
          fs.writeFileSync(dest, Buffer.from(shotResult.data, "base64"));
          const dims = await send("Runtime.evaluate", {
            expression:
              "({ w: window.innerWidth, h: window.innerHeight, scrollW: document.documentElement.scrollWidth })",
            returnByValue: true,
          });
          console.log(
            `wrote ${shot.file} viewport=${dims.result.value.w}x${dims.result.value.h}`
          );
        });
        await browserSend("Target.closeTarget", { targetId: created.targetId });
      }

      // Admin login + full-width dashboard (includes sidebar)
      const created = await browserSend("Target.createTarget", {
        url: "about:blank",
      });
      await sleep(300);
      const list = await cdpHttp(port, "/json/list");
      const page = list.find((t) => t.id === created.targetId);
      await withWs(page.webSocketDebuggerUrl, async (send) => {
        await send("Page.enable");
        await send("Runtime.enable");
        await send("Emulation.setDeviceMetricsOverride", {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        // Prefer Arabic admin UI for the recapture.
        await send("Network.enable").catch(() => {});
        await send("Network.setCookie", {
          name: "ro_locale",
          value: "ar",
          url: BASE,
        }).catch(() => {});
        await send("Page.navigate", { url: `${BASE}/admin/login` });
        await sleep(2000);
        const filled = await send("Runtime.evaluate", {
          expression: `(() => {
            const setNative = (el, value) => {
              const proto = window.HTMLInputElement.prototype;
              const desc = Object.getOwnPropertyDescriptor(proto, "value");
              desc.set.call(el, value);
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            };
            const email = document.querySelector('input[name="email"]');
            const pass = document.querySelector('input[name="password"]');
            if (!email || !pass) return { ok: false, reason: "missing-fields" };
            setNative(email, "admin@rareoud.local");
            setNative(pass, "ChangeMeNow!");
            const btn = document.querySelector('button[type="submit"]');
            if (btn) btn.click();
            else document.querySelector("form")?.requestSubmit();
            return { ok: true, email: email.value.length, pass: pass.value.length };
          })()`,
          returnByValue: true,
        });
        console.log("admin login fill", filled.result.value);
        await sleep(4000);
        // Ensure we land on dashboard (action may redirect).
        const where = await send("Runtime.evaluate", {
          expression: "location.pathname",
          returnByValue: true,
        });
        if (!String(where.result.value).startsWith("/admin") || String(where.result.value).includes("login")) {
          await send("Page.navigate", { url: `${BASE}/admin` });
          await sleep(2500);
        }
        const shotResult = await send("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
          captureBeyondViewport: false,
        });
        const dest = path.join(ADMIN_OUT, "real-admin-1440-ar.png");
        fs.writeFileSync(dest, Buffer.from(shotResult.data, "base64"));
        const url = await send("Runtime.evaluate", {
          expression: "location.href",
          returnByValue: true,
        });
        console.log(`wrote real-admin-1440-ar.png at ${url.result.value}`);
      });
      await browserSend("Target.closeTarget", { targetId: created.targetId });
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
