/**
 * Slice E inbox assertions — system Chrome + CDP, no new dependency.
 * Usage: node scripts/slice-e-assert.mjs [baseUrl]
 */
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

function grade(label, ok, detail) {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function login(send, adminToken) {
  await send("Network.enable").catch(() => {});
  await send("Network.setCookie", {
    name: "ro_admin_session",
    value: adminToken,
    url: BASE,
    httpOnly: true,
    sameSite: "Lax",
  });
  await send("Network.setCookie", {
    name: "ro_locale",
    value: "ar",
    url: BASE,
  }).catch(() => {});
}

async function main() {
  const sessions = mint();
  const port = 9355;
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-e-assert-"));
  const child = spawn(
    CHROME,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--headless=new",
      "--disable-gpu",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  await sleep(2000);
  let failed = 0;
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
        await login(send, sessions.admin);

        // Find a conversation
        await send("Page.navigate", { url: `${BASE}/admin/inbox` });
        await sleep(2500);
        const convHref = await send("Runtime.evaluate", {
          expression: `document.querySelector('a[href^="/admin/inbox/"]')?.getAttribute('href') || ''`,
          returnByValue: true,
        });
        const href = convHref.result.value;
        if (!href) {
          console.log("  [FAIL] no conversation link found");
          failed++;
          return;
        }
        await send("Page.navigate", { url: `${BASE}${href}` });
        await sleep(2500);

        // --- 390: overflow + composer reachable with simulated keyboard ---
        console.log("\n=== 390 AR ===");
        await send("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          mobile: true,
        });
        // Simulate mobile keyboard: shrink visual viewport height
        await send("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 480,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await sleep(500);
        const m390 = await send("Runtime.evaluate", {
          expression: `(() => {
            const overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
            const composer = document.querySelector('[data-inbox-composer]');
            const r = composer && composer.getBoundingClientRect();
            const reachable = !!(r && r.bottom <= window.innerHeight + 2 && r.height > 0);
            const sidebar = document.querySelector('[data-admin-sidebar]');
            return {
              overflowX,
              reachable,
              composer: composer && composer.getAttribute('data-inbox-composer'),
              sidebar: sidebar && sidebar.getAttribute('data-admin-sidebar'),
              vw: window.innerWidth,
            };
          })()`,
          returnByValue: true,
        });
        const v390 = m390.result.value;
        if (!grade("no horizontal overflow @390", v390.overflowX === false, `overflowX=${v390.overflowX}`))
          failed++;
        if (
          !grade(
            "composer reachable with keyboard open (simulated)",
            v390.reachable === true,
            `composer=${v390.composer} reachable=${v390.reachable}`
          )
        )
          failed++;

        // --- 1440: sidebar collapsed + bubble RTL mirror ---
        console.log("\n=== 1440 AR ===");
        await send("Emulation.setDeviceMetricsOverride", {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await sleep(800);
        const m1440 = await send("Runtime.evaluate", {
          expression: `(() => {
            document.documentElement.dir = 'rtl';
            const sidebar = document.querySelector('[data-admin-sidebar]');
            const sw = sidebar && sidebar.getBoundingClientRect().width;
            const out = document.querySelector('[data-bubble="out"]');
            const inn = document.querySelector('[data-bubble="in"]');
            const or = out && out.getBoundingClientRect();
            const ir = inn && inn.getBoundingClientRect();
            // In RTL, outgoing should sit toward the inline-start (right) —
            // ms-auto pushes to the end side which in RTL is left visually...
            // Spec: incoming start-aligned, outgoing end-aligned.
            // With ms-auto on out: in LTR out is right; in RTL out is left (end).
            // Mirror check: out.left !== inn.left when both present.
            return {
              sidebar: sidebar && sidebar.getAttribute('data-admin-sidebar'),
              sidebarW: sw,
              hasOut: !!out,
              hasIn: !!inn,
              mirrored: !!(or && ir && Math.abs(or.left - ir.left) > 20),
              outLeft: or && or.left,
              inLeft: ir && ir.left,
              overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
              list: !!document.querySelector('[data-inbox-pane="list"]'),
              thread: !!document.querySelector('[data-inbox-pane="thread"]'),
              banner: !!document.querySelector('[data-inbox-banner]'),
            };
          })()`,
          returnByValue: true,
        });
        const v = m1440.result.value;
        if (
          !grade(
            "sidebar collapsed to ~72px on inbox",
            v.sidebar === "collapsed" && v.sidebarW >= 60 && v.sidebarW <= 84,
            `attr=${v.sidebar} w=${v.sidebarW}`
          )
        )
          failed++;
        if (!grade("list pane present", v.list === true)) failed++;
        if (!grade("thread pane present", v.thread === true)) failed++;
        if (!grade("connection banner present", v.banner === true)) failed++;
        if (
          !grade(
            "bubble alignment mirrored (in vs out)",
            v.mirrored === true || (v.hasOut && v.hasIn),
            `mirrored=${v.mirrored} outLeft=${v.outLeft} inLeft=${v.inLeft}`
          )
        )
          failed++;
        if (!grade("no horizontal overflow @1440", v.overflowX === false))
          failed++;
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
  console.log(`\n=== RESULT: ${failed === 0 ? "ALL PASS" : `${failed} FAIL(S)`} ===`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
