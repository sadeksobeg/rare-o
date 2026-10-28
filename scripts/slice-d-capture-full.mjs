/**
 * Full-page Home screenshots (AR 1440 + 390) + scrolled-header check shot.
 * No new dependency — system Chrome + CDP.
 *
 * Usage: node scripts/slice-d-capture-full.mjs [baseUrl]
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
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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

async function captureFull(send, { file, w, h }) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: w <= 400,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await send("Page.navigate", { url: `${BASE}/` });
  await sleep(2800);
  await send("Runtime.evaluate", {
    expression: "window.scrollTo(0,0)",
  });
  await sleep(300);

  // Full document height
  const metrics = await send("Runtime.evaluate", {
    expression: `({
      scrollH: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      scrollW: document.documentElement.clientWidth,
      blocks: [...document.querySelectorAll('[data-home-block]')].map(el => el.getAttribute('data-home-block'))
    })`,
    returnByValue: true,
  });
  const { scrollH, scrollW, blocks } = metrics.result.value;

  // Resize viewport height to full page for a single tall capture
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: Math.min(scrollH + 40, 16000),
    deviceScaleFactor: 1,
    mobile: w <= 400,
  });
  await sleep(500);

  const shot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
  });
  const dest = path.join(OUT, file);
  fs.writeFileSync(dest, Buffer.from(shot.data, "base64"));
  console.log(
    `wrote ${file} w=${scrollW} fullH≈${scrollH} blocks=${blocks.join("→")}`
  );
}

async function captureScrolledHeader(send) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: `${BASE}/` });
  await sleep(2500);
  await send("Runtime.evaluate", { expression: "window.scrollTo(0, 240)" });
  await sleep(700);
  const bg = await send("Runtime.evaluate", {
    expression: `({
      bg: getComputedStyle(document.querySelector('header')).backgroundColor,
      over: document.querySelector('header').getAttribute('data-over-hero')
    })`,
    returnByValue: true,
  });
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const dest = path.join(OUT, "home-ar-1440-scrolled-header.png");
  fs.writeFileSync(dest, Buffer.from(shot.data, "base64"));
  console.log(
    `wrote home-ar-1440-scrolled-header.png bg=${bg.result.value.bg} overHero=${bg.result.value.over}`
  );
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const port = 9341;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-full-"));
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
      for (const spec of [
        { file: "home-ar-1440-full.png", w: 1440, h: 900 },
        { file: "home-ar-390-full.png", w: 390, h: 844 },
      ]) {
        const created = await browserSend("Target.createTarget", {
          url: "about:blank",
        });
        await sleep(300);
        const list = await cdpHttp(port, "/json/list");
        const page = list.find((t) => t.id === created.targetId);
        await withWs(page.webSocketDebuggerUrl, async (send) => {
          await send("Page.enable");
          await send("Runtime.enable");
          await captureFull(send, spec);
        });
        await browserSend("Target.closeTarget", {
          targetId: created.targetId,
        });
      }

      const created = await browserSend("Target.createTarget", {
        url: "about:blank",
      });
      await sleep(300);
      const list = await cdpHttp(port, "/json/list");
      const page = list.find((t) => t.id === created.targetId);
      await withWs(page.webSocketDebuggerUrl, async (send) => {
        await send("Page.enable");
        await send("Runtime.enable");
        await captureScrolledHeader(send);
      });
      await browserSend("Target.closeTarget", { targetId: created.targetId });

      // Also refresh viewport 390 hero shot after rings fix
      const created2 = await browserSend("Target.createTarget", {
        url: "about:blank",
      });
      await sleep(300);
      const list2 = await cdpHttp(port, "/json/list");
      const page2 = list2.find((t) => t.id === created2.targetId);
      await withWs(page2.webSocketDebuggerUrl, async (send) => {
        await send("Page.enable");
        await send("Runtime.enable");
        await send("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await send("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-reduced-motion", value: "reduce" }],
        });
        await send("Page.navigate", { url: `${BASE}/` });
        await sleep(2500);
        const shot = await send("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
        });
        fs.writeFileSync(
          path.join(OUT, "home-ar-390.png"),
          Buffer.from(shot.data, "base64")
        );
        console.log("wrote home-ar-390.png (rings-below refresh)");
      });
      await browserSend("Target.closeTarget", { targetId: created2.targetId });
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
