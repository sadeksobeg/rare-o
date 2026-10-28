/**
 * Slice D home assertions — no new npm dependency (system Chrome + CDP).
 *
 * Usage: node scripts/slice-d-hero-assert.mjs [baseUrl]
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:3010";
const WIDTHS = [1440, 390];
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const REQUIRED_BLOCKS = ["H1", "H2", "H7", "H8", "H9"];
const OPTIONAL_BLOCKS = ["H3", "H4", "H5", "H6"];
const SF01_ORDER = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9"];

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome not found. Set CHROME_PATH.");
}

function parseRgba(input) {
  if (!input || input === "transparent" || input === "rgba(0, 0, 0, 0)") {
    return null;
  }
  const m = String(input).match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?/
  );
  if (!m) return null;
  return {
    rgb: [Number(m[1]), Number(m[2]), Number(m[3])],
    a: m[4] === undefined ? 1 : Number(m[4]),
  };
}

function composite(fg, bg) {
  const f = parseRgba(fg);
  const b = parseRgba(bg);
  if (!f || !b) return null;
  const a = f.a;
  return [
    f.rgb[0] * a + b.rgb[0] * (1 - a),
    f.rgb[1] * a + b.rgb[1] * (1 - a),
    f.rgb[2] * a + b.rgb[2] * (1 - a),
  ];
}

function relLuminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(fg, bg) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

function nearColor(actual, expected, tol = 8) {
  const a = parseRgba(actual);
  const e = parseRgba(expected);
  if (!a || !e) return false;
  return (
    Math.abs(a.rgb[0] - e.rgb[0]) <= tol &&
    Math.abs(a.rgb[1] - e.rgb[1]) <= tol &&
    Math.abs(a.rgb[2] - e.rgb[2]) <= tol &&
    a.a >= 0.99
  );
}

async function cdpHttp(port, pathname) {
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
  if (!res.ok) throw new Error(`CDP ${pathname} → ${res.status}`);
  return res.json();
}

async function withSession(wsUrl, fn) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  let nextId = 1;
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
  const send = (method, params = {}) => {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
  try {
    return await fn(send);
  } finally {
    ws.close();
  }
}

const MEASURE_JS = `(() => {
  const h1 = document.querySelector('[data-hero="resonance"] h1');
  const header = document.querySelector('header');
  const topNav = header && header.querySelector(':scope > div > nav a');
  const hero = document.querySelector('[data-hero="resonance"]');
  const ringsMobile = document.querySelector('[data-hero-rings-mobile]');
  const overHero = header && header.getAttribute('data-over-hero') === 'true';
  const overflowX =
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      text: (el.textContent || '').trim().slice(0, 80),
      opacity: Number(cs.opacity),
      color: cs.color,
      width: r.width,
      height: r.height,
      top: r.top,
      bottom: r.bottom,
      visible:
        Number(cs.opacity) >= 0.99 &&
        r.width > 0 &&
        r.height > 0 &&
        cs.visibility !== 'hidden' &&
        cs.display !== 'none',
    };
  }

  const blocks = [...document.querySelectorAll('[data-home-block]')].map((el) => {
    const id = el.getAttribute('data-home-block');
    const r = el.getBoundingClientRect();
    const text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    const emptyShell =
      text.length < 8 || r.height < 24 || el.children.length === 0;
    return { id, top: r.top + window.scrollY, height: r.height, textLen: text.length, emptyShell };
  });

  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    scrollY: window.scrollY,
    headerOverHero: header && header.getAttribute('data-over-hero'),
    headerPosition: header && getComputedStyle(header).position,
    headerBg: header && getComputedStyle(header).backgroundColor,
    heroTop: hero ? hero.getBoundingClientRect().top : null,
    h1: box(h1),
    navLink: box(topNav),
    ringsMobile: ringsMobile
      ? {
          top: ringsMobile.getBoundingClientRect().top,
          opacity: Number(getComputedStyle(ringsMobile.querySelector('svg') || ringsMobile).opacity),
          display: getComputedStyle(ringsMobile).display,
        }
      : null,
    blocks,
    overflowX,
  };
})()`;

async function evaluate(send, expression) {
  const evaluated = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: false,
  });
  return evaluated.result.value;
}

async function measure(send, width) {
  const height = width <= 400 ? 844 : 900;
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 400,
  });
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await send("Page.navigate", { url: `${BASE}/` });
  await sleep(2500);
  const top = await evaluate(send, MEASURE_JS);

  // Scroll past threshold → solid cream header
  await evaluate(send, "window.scrollTo(0, 200)");
  await sleep(600);
  const scrolled = await evaluate(
    send,
    `(() => {
      const header = document.querySelector('header');
      const link = header && header.querySelector(':scope > div > nav a, :scope > div a');
      const brand = header && header.querySelector(':scope > div > a span, :scope > div a');
      return {
        scrollY: window.scrollY,
        overHero: header && header.getAttribute('data-over-hero'),
        headerBg: header && getComputedStyle(header).backgroundColor,
        linkColor: link && getComputedStyle(link).color,
        brandColor: brand && getComputedStyle(brand).color,
      };
    })()`
  );

  await evaluate(send, "window.scrollTo(0, 0)");
  await sleep(400);

  return { top, scrolled };
}

function grade(label, ok, detail) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

function assertStack(blocks) {
  let failed = 0;
  const ids = blocks.map((b) => b.id);
  console.log(`  stack present: ${ids.join(" → ")}`);

  for (const req of REQUIRED_BLOCKS) {
    if (!grade(`required ${req} present`, ids.includes(req))) failed++;
  }

  // Order must match SF-01 subsequence
  const orderIdx = ids.map((id) => SF01_ORDER.indexOf(id));
  const ordered = orderIdx.every((v, i, arr) => i === 0 || v > arr[i - 1]);
  if (
    !grade(
      "H1..H9 order matches SF-01 subsequence",
      ordered && orderIdx.every((v) => v >= 0),
      ids.join(" → ")
    )
  )
    failed++;

  for (const b of blocks) {
    if (
      !grade(
        `${b.id} not an empty shell`,
        !b.emptyShell && b.height > 24 && b.textLen >= 8,
        `h=${Math.round(b.height)} textLen=${b.textLen}`
      )
    )
      failed++;
  }

  // Optional blocks: if missing, that is OK (removed when no data) — just note
  for (const opt of OPTIONAL_BLOCKS) {
    if (!ids.includes(opt)) {
      console.log(
        `  [INFO] ${opt} absent (allowed when no data — must not render empty)`
      );
    }
  }

  return failed;
}

async function main() {
  const chrome = findChrome();
  const port = 9222 + Math.floor(Math.random() * 200);
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "ro-slice-d-"));
  const child = spawn(
    chrome,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userData}`,
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  const rl = createInterface({ input: child.stderr });
  await Promise.race([
    sleep(2500),
    new Promise((resolve) => rl.on("line", () => resolve())),
  ]);

  let failed = 0;
  try {
    const version = await cdpHttp(port, "/json/version");
    await withSession(version.webSocketDebuggerUrl, async (browserSend) => {
      for (const width of WIDTHS) {
        console.log(`\n=== ${width}px / ar (reduced-motion) ===`);
        const created = await browserSend("Target.createTarget", {
          url: "about:blank",
        });
        await sleep(400);
        const targets = await cdpHttp(port, "/json/list");
        const page = targets.find((t) => t.id === created.targetId);
        if (!page?.webSocketDebuggerUrl) {
          throw new Error(`page target missing: ${created.targetId}`);
        }
        const data = await withSession(page.webSocketDebuggerUrl, async (send) => {
          await send("Page.enable");
          await send("Runtime.enable");
          return measure(send, width);
        });
        await browserSend("Target.closeTarget", { targetId: created.targetId });

        const { top, scrolled } = data;
        console.log(
          `  viewport=${top.viewport.w}x${top.viewport.h} header=${top.headerPosition} overHero=${top.headerOverHero} heroTop=${top.heroTop}`
        );

        const h1 = top.h1;
        if (
          !grade(
            "hero h1 present + opacity 1 + non-zero box",
            !!(h1 && h1.visible && h1.opacity >= 0.99),
            h1
              ? `opacity=${h1.opacity} box=${Math.round(h1.width)}x${Math.round(h1.height)} "${h1.text}"`
              : "missing"
          )
        )
          failed++;

        if (h1) {
          const fg = composite(h1.color, "rgb(11, 8, 13)");
          const ratio = fg ? contrastRatio(fg, [11, 8, 13]) : 0;
          if (
            !grade(
              "hero h1 contrast >= 4.5 vs ink",
              ratio >= 4.5,
              `ratio=${ratio.toFixed(2)}`
            )
          )
            failed++;
        } else failed++;

        if (width < 1024) {
          console.log(
            "  [SKIP] desktop nav not shown below lg — mobile uses hamburger"
          );
          const rings = top.ringsMobile;
          if (
            !grade(
              "390 rings below headline (not overlapping)",
              !!(
                rings &&
                h1 &&
                rings.display !== "none" &&
                rings.top >= h1.bottom - 2
              ),
              rings && h1
                ? `ringsTop=${Math.round(rings.top)} h1Bottom=${Math.round(h1.bottom)}`
                : "missing"
            )
          )
            failed++;
        } else {
          const nav = top.navLink;
          if (
            !grade(
              "header nav link visible + opacity 1",
              !!(nav && nav.visible && nav.opacity >= 0.99),
              nav ? `opacity=${nav.opacity} "${nav.text}"` : "missing"
            )
          )
            failed++;
          if (nav) {
            const fg = composite(nav.color, "rgb(11, 8, 13)");
            const ratio = fg ? contrastRatio(fg, [11, 8, 13]) : 0;
            if (
              !grade(
                "header nav contrast >= 4.5 (over-hero)",
                ratio >= 4.5,
                `ratio=${ratio.toFixed(2)}`
              )
            )
              failed++;
          }
        }

        if (
          !grade(
            "hero starts near y=0 (overlay header)",
            top.heroTop !== null && Math.abs(top.heroTop) <= 2,
            `heroTop=${top.heroTop}`
          )
        )
          failed++;

        if (
          !grade(
            "no horizontal overflow",
            top.overflowX === false,
            `overflowX=${top.overflowX}`
          )
        )
          failed++;

        failed += assertStack(top.blocks);

        // Scrolled header: solid sand-100 (#f4e7d8 = rgb(244,231,216))
        if (
          !grade(
            "scrolled header solid sand-100 (not grey translucent)",
            scrolled.overHero === "false" &&
              nearColor(scrolled.headerBg, "rgb(244, 231, 216)"),
            `overHero=${scrolled.overHero} bg=${scrolled.headerBg}`
          )
        )
          failed++;

        if (width >= 1024 && scrolled.linkColor) {
          const fg = composite(scrolled.linkColor, scrolled.headerBg);
          const bg = parseRgba(scrolled.headerBg)?.rgb;
          const ratio = fg && bg ? contrastRatio(fg, bg) : 0;
          if (
            !grade(
              "scrolled header link contrast >= 4.5",
              ratio >= 4.5,
              `ratio=${ratio.toFixed(2)} fg=${scrolled.linkColor} bg=${scrolled.headerBg}`
            )
          )
            failed++;
        }
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

  console.log(`\n=== RESULT: ${failed === 0 ? "ALL PASS" : `${failed} FAIL(S)`} ===`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
