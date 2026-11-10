/**
 * Slice F follow-up shots: wizard steps 2–3, wholesale review, waiting deal detail.
 * Usage: node scripts/slice-f-extra-capture.mjs [baseUrl]
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "ui-planning", "screenshots", "slice-f");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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
  const sessions = mint();
  fs.mkdirSync(OUT, { recursive: true });
  const port = 9358;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-f-x-"));
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
          name: "ro_trader_session",
          value: sessions.trader,
          url: BASE,
          httpOnly: true,
          sameSite: "Lax",
        });
        await send("Network.setCookie", {
          name: "ro_locale",
          value: "ar",
          url: BASE,
        });
        await send("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          mobile: false,
        });

        // --- Wizard step 2 + 3 ---
        await send("Page.navigate", { url: `${BASE}/trader/deals/new` });
        await sleep(2500);
        await send("Runtime.evaluate", {
          expression: `(() => {
            sessionStorage.removeItem("ro-trader-deal-draft");
            const set = (sel, val) => {
              const el = document.querySelector(sel);
              if (!el) return;
              const proto = el.tagName === "TEXTAREA"
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype;
              const desc = Object.getOwnPropertyDescriptor(proto, "value");
              desc.set.call(el, val);
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
            };
            const selects = document.querySelectorAll("select");
            if (selects[0]) {
              selects[0].value = "catalog";
              selects[0].dispatchEvent(new Event("change", { bubbles: true }));
            }
            const title = document.querySelector('input[maxlength="200"], input:not([type])');
            // fill controlled React fields via React fiber is hard — use draft inject
            sessionStorage.setItem("ro-trader-deal-draft", JSON.stringify({
              step: 1,
              dealKind: "catalog",
              title: "عرض على عود ورشة",
              productId: document.querySelector("select option[value]:not([value=''])")?.value || "",
              message: "نرغب بكمية محدودة.",
              proposedPrice: "1800",
              currency: "USD",
              quantity: "2",
              conditionsNotes: "تسليم خلال أسبوعين"
            }));
            location.reload();
            return true;
          })()`,
          returnByValue: true,
        });
        await sleep(2800);
        await shot(send, "deal-wizard-step2-ar-390.png");

        await send("Runtime.evaluate", {
          expression: `(() => {
            const draft = JSON.parse(sessionStorage.getItem("ro-trader-deal-draft") || "{}");
            draft.step = 2;
            sessionStorage.setItem("ro-trader-deal-draft", JSON.stringify(draft));
            location.reload();
            return true;
          })()`,
          returnByValue: true,
        });
        await sleep(2800);
        await shot(send, "deal-wizard-review-ar-390.png");

        // --- Wholesale review with 2 items ---
        await send("Page.navigate", { url: `${BASE}/trader/wholesale` });
        await sleep(2500);
        await send("Runtime.evaluate", {
          expression: `(() => {
            const adds = [...document.querySelectorAll("button")].filter(b => /إضافة|Add/i.test(b.textContent || ""));
            adds.slice(0, 2).forEach(b => b.click());
            return adds.length;
          })()`,
          returnByValue: true,
        });
        await sleep(800);
        await send("Runtime.evaluate", {
          expression: `(() => {
            const btn = [...document.querySelectorAll("button")].find(b => /مراجعة وإرسال|Review/i.test(b.textContent || ""));
            btn?.click();
            return !!btn;
          })()`,
          returnByValue: true,
        });
        await sleep(1200);
        await shot(send, "wholesale-review-ar-390.png");

        // --- Waiting deal detail ---
        await send("Page.navigate", { url: `${BASE}/trader/deals` });
        await sleep(2200);
        const dealHref = await send("Runtime.evaluate", {
          expression: `document.querySelector('a[href^="/trader/deals/"]')?.getAttribute("href") || ""`,
          returnByValue: true,
        });
        let path = dealHref.result?.value || "";
        if (!path || path === "/trader/deals/new") {
          // find waiting chip link
          path = await send("Runtime.evaluate", {
            expression: `([...document.querySelectorAll('a[href^="/trader/deals/"]')].find(a => a.getAttribute("href") !== "/trader/deals/new")?.getAttribute("href")) || ""`,
            returnByValue: true,
          }).then((r) => r.result?.value || "");
        }
        if (path) {
          await send("Page.navigate", { url: `${BASE}${path}` });
          await sleep(2500);
          await shot(send, "deal-waiting-ar-390.png");
        } else {
          console.log("SKIP deal-waiting — no deal link");
        }

        // Also recapture wizard desktop width briefly
        await send("Emulation.setDeviceMetricsOverride", {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await send("Page.navigate", { url: `${BASE}/trader/deals/new` });
        await sleep(2200);
        await shot(send, "deal-wizard-ar-1440.png");
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
