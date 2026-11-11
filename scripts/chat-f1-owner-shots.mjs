/**
 * CHAT-F1.1 owner screenshots + geometry gates (local chat/f1-fixes).
 *   node scripts/chat-f1-owner-shots.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs/chat/shots/owner");
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env) || !process.env[k]) process.env[k] = v;
  }
}
loadDotEnv();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TRADER_EMAIL = process.env.TRADER_EMAIL || "trader@rareoud.local";
const TRADER_PASSWORD = process.env.TRADER_PASSWORD || "ChangeMeNow!";
const notes = [];
const consoleIssues = [];

async function setVal(page, sel, val) {
  const loc = page.locator(sel).first();
  await loc.waitFor({ state: "visible", timeout: 20000 });
  await loc.click();
  await loc.fill("");
  await page.keyboard.type(val, { delay: 5 });
}

async function loginTrader(page) {
  await page.goto(`${BASE}/trader/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', TRADER_EMAIL);
  await setVal(page, 'input[name="password"]', TRADER_PASSWORD);
  await Promise.all([
    page.waitForURL(
      (u) => u.pathname.startsWith("/trader") && !u.pathname.includes("/login"),
      { timeout: 30000 }
    ),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

async function loginAdmin(page) {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await setVal(page, 'input[name="email"]', ADMIN_EMAIL);
  await setVal(page, 'input[name="password"]', ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 30000 }),
    page.getByRole("button", { name: /sign in|دخول|تسجيل الدخول/i }).click(),
  ]);
}

async function hideDevOverlays(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-next-badge], #__next-build-watcher,
      [data-nextjs-dialog-overlay], [data-nextjs-dev-overlay] { display: none !important; }
    `,
  }).catch(() => {});
}

async function shot(page, name, see) {
  await hideDevOverlays(page);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
  notes.push({ file: name, see });
  console.log(`SEE ${name}: ${see}`);
}

function runTsx(rel) {
  const r = spawnSync("npx", ["tsx", rel], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    shell: true,
  });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error(`${rel} failed`);
  }
  const line = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean).pop();
  try {
    return JSON.parse(line);
  } catch {
    return { raw: line };
  }
}

function attachConsole(page, label) {
  page.on("pageerror", (e) => {
    consoleIssues.push({
      label,
      kind: "pageerror",
      text: String(e.message || e),
      stack: String(e.stack || "").split("\n")[0] || "",
    });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      const loc = msg.location();
      consoleIssues.push({
        label,
        kind: msg.type(),
        text: msg.text(),
        stack: loc?.url
          ? `${loc.url}:${loc.lineNumber || 0}:${loc.columnNumber || 0}`
          : "",
      });
    }
  });
}

/** Gate: strip between composer bottom and tab top must not hit message nodes. */
async function gateComposerStrip(page) {
  return page.evaluate(() => {
    const composer = document.querySelector(".rad-tmsg-composer");
    const tab = document.querySelector(".rad-tabbar");
    if (!composer) return { ok: false, reason: "no composer" };
    const c = composer.getBoundingClientRect();
    const tabVisible =
      tab && getComputedStyle(tab).display !== "none" && tab.getBoundingClientRect().height > 0;
    const floor = tabVisible
      ? tab.getBoundingClientRect().y
      : window.innerHeight;
    const gap = floor - (c.y + c.height);
    if (tabVisible && gap < 0) {
      return {
        ok: false,
        reason: `composer overlaps tab by ${-gap}px`,
        position: getComputedStyle(composer).position,
      };
    }
    // Sample the strip under the composer (or just inside viewport bottom on desktop).
    const y = Math.min(
      c.y + c.height + Math.max(2, tabVisible ? Math.min(gap / 2, 12) : 4),
      window.innerHeight - 2
    );
    const xs = [0.15, 0.35, 0.5, 0.65, 0.85].map((f) => window.innerWidth * f);
    const hits = [];
    for (const x of xs) {
      const stack = document.elementsFromPoint(x, y);
      const bad = stack.find((el) => {
        if (!(el instanceof Element)) return false;
        if (el.closest(".rad-tmsg-composer") || el.closest(".rad-tabbar")) {
          return false;
        }
        return Boolean(
          el.closest(".rad-tmsg-scroll article, .rad-tmsg-scroll .group, [data-msg-id]")
        );
      });
      hits.push({
        x: Math.round(x),
        y: Math.round(y),
        top: stack[0]?.tagName || "?",
        bad: bad
          ? (bad.closest("article, .group")?.className || bad.tagName)
          : null,
      });
    }
    const offenders = hits.filter((h) => h.bad);
    const scroll = document.querySelector(".rad-tmsg-scroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
    const c2 = composer.getBoundingClientRect();
    const msgs = scroll
      ? scroll.querySelectorAll("article, .group")
      : [];
    const last = msgs[msgs.length - 1];
    let lastOk = true;
    let lastDetail = "no messages";
    if (last) {
      const r = last.getBoundingClientRect();
      lastOk = r.bottom <= c2.y + 2;
      lastDetail = `last.bottom=${Math.round(r.bottom)} composer.top=${Math.round(c2.y)}`;
    }
    return {
      ok: offenders.length === 0 && lastOk,
      gap: Math.round(gap),
      tabVisible: Boolean(tabVisible),
      offenders,
      hits,
      lastOk,
      lastDetail,
      position: getComputedStyle(composer).position,
    };
  });
}

async function gateHeaderNoOverlap(page) {
  return page.evaluate(() => {
    const title = document.querySelector(".rad-th .rad-tt > b");
    const badges = [...document.querySelectorAll(".rad-th-badges .rad-chipl")];
    if (!title) return { ok: false, reason: "no title" };
    const t = title.getBoundingClientRect();
    const overlaps = [];
    for (const b of badges) {
      const r = b.getBoundingClientRect();
      const inter =
        !(r.right <= t.left || r.left >= t.right || r.bottom <= t.top || r.top >= t.bottom);
      if (inter) {
        overlaps.push({
          text: (b.textContent || "").trim().slice(0, 40),
          title: {
            top: Math.round(t.top),
            bottom: Math.round(t.bottom),
          },
          badge: {
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
          },
        });
      }
    }
    return {
      ok: overlaps.length === 0,
      badgeCount: badges.length,
      overlaps,
      titleText: (title.textContent || "").trim().slice(0, 60),
    };
  });
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL/PASSWORD required");
  fs.mkdirSync(OUT, { recursive: true });

  spawnSync("npx", ["tsx", "scripts/audit-reset-demo-trader.ts"], {
    cwd: ROOT,
    env: process.env,
    shell: true,
  });
  const conflict = runTsx("scripts/force-f1-conflict.ts");
  const seed = runTsx("scripts/_tmp-f1-seed.ts");
  console.log("conflict", conflict, "seed", seed);

  const browser = await chromium.launch({ headless: true });

  // 01 / 07 / 08 trader @ 390
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    attachConsole(page, "trader-390");
    await loginTrader(page);
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "networkidle" }).catch(() =>
      page.goto(`${BASE}/trader/messages`, { waitUntil: "domcontentloaded" })
    );
    await page.locator(".rad-tmsg-composer").waitFor({ timeout: 20000 });
    await page.locator(".rad-tmsg-scroll").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    }).catch(() => {});
    await page.waitForTimeout(400);

    const gate1 = await gateComposerStrip(page);
    console.log("GATE composer-strip-390", JSON.stringify(gate1));
    const sendIcon = await page
      .locator(".rad-tmsg-composer button[type='submit'] svg")
      .first()
      .evaluate((svg) => {
        const cls = svg.getAttribute("class") || "";
        return { className: cls, aria: svg.closest("button")?.getAttribute("aria-label") };
      })
      .catch(() => ({ className: "?", aria: "?" }));

    await shot(
      page,
      "01-trader-390-composer.png",
      gate1.ok
        ? `ملحن تذييل تدفق عادي (position=${gate1.position})؛ فجوة ${gate1.gap}px فوق التبويب؛ آخر رسالة فوق الملحن؛ أيقونة إرسال aria=${sendIcon.aria}`
        : `DEFECT تخطيط: ${gate1.reason || gate1.lastDetail || ""} offenders=${JSON.stringify(gate1.offenders)}`
    );

    await page.locator(".rad-tmsg-scroll").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    }).catch(() => {});
    const ph = page.getByText(/مرفق من واتساب|WhatsApp attachment/i).first();
    if (await ph.count()) {
      await ph.scrollIntoViewIfNeeded();
      await shot(
        page,
        "08-trader-wa-media-placeholder.png",
        "عبارة «مرفق من واتساب (غير متاح هنا)» ظاهرة؛ الملحن تذييل وليس عائماً"
      );
    } else {
      await shot(
        page,
        "08-trader-wa-media-placeholder.png",
        "DEFECT: لم يظهر وسم وسائط واتساب في الخيط"
      );
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const root =
        document.querySelector('[data-portal="trader"]') || document.documentElement;
      root.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(300);
    const gate1440 = await gateComposerStrip(page);
    console.log("GATE composer-strip-1440", JSON.stringify(gate1440));
    await shot(
      page,
      "02-trader-1440-dark-contrast.png",
      `1440 داكن: تباين فقاعة التاجر؛ زر إرسال paper-plane aria=إرسال؛ تذييل ملحن position=${gate1440.position}`
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/trader/messages`, { waitUntil: "domcontentloaded" });
    await page.locator(".rad-tmsg-composer textarea").waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    const ta = page.locator(".rad-tmsg-composer textarea").first();
    const sendBtn = page.locator(".rad-tmsg-composer button[type='submit']").first();
    for (let i = 0; i < 22; i++) {
      await ta.click();
      await ta.fill("");
      await ta.type(`حد إرسال اختبار ${i}`, { delay: 2 });
      await sendBtn.waitFor({ state: "visible", timeout: 5000 });
      // Prefer Enter submit — avoids disabled-button races mid-transition.
      await ta.press("Enter");
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(700);
    const err = page.locator('.rad-tmsg-composer [role="alert"]').first();
    const gate7 = await gateComposerStrip(page);
    const errText = (await err.count()) ? (await err.innerText()).slice(0, 80) : "";
    const draftLeft = await ta.inputValue().catch(() => "");
    await shot(
      page,
      "07-trader-rate-limit.png",
      errText
        ? `رسالة حد حمراء: «${errText}»؛ مسودة باقية=${Boolean(draftLeft)}؛ تذييل سليم=${gate7.ok}`
        : "DEFECT: لا رسالة حد إرسال بعد 22 محاولة"
    );
    await page.close();
  }

  // 03–06 admin
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    attachConsole(page, "admin");
    await loginAdmin(page);
    const convId = seed.conversationId;
    await page.goto(`${BASE}/admin/inbox/${convId}`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator(".rad-th").first().waitFor({ timeout: 20000 });
    await page.evaluate(() => {
      const root =
        document.querySelector('[data-portal="admin"]') || document.documentElement;
      root.setAttribute("data-theme", "dark");
    });
    // Wait until thread has at least one bubble OR empty-state copy — not a blank loader
    await page
      .locator(".rad-bb, .rad-cbx b, .rad-th-badges")
      .first()
      .waitFor({ timeout: 20000 })
      .catch(() => {});
    await page.waitForTimeout(500);

    await shot(
      page,
      "03-admin-channel-chips.png",
      "شارات قناة على الفقاعات (عبر المنصة / عبر واتساب) إن وُجدت رسائل"
    );

    const willSend = page
      .getByText(/سيصل الرد عبر|will send via/i)
      .first();
    await willSend.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    const bubbleCount = await page.locator(".rad-bb").count();
    const willText = (await willSend.count())
      ? (await willSend.innerText()).trim()
      : "";
    await shot(
      page,
      "04-admin-composer-will-send.png",
      bubbleCount > 0 && willText
        ? `الخيط محمّل (${bubbleCount} فقاعة)؛ المؤشر: «${willText.slice(0, 60)}»`
        : `DEFECT: messages=${bubbleCount} willSend=${willText || "missing"}`
    );

    // Fallback: send while outbound/WA down should surface platform notice
    const toasts = [];
    page.on("console", () => {});
    const ta = page.locator(".rad-cmp textarea").first();
    let fallbackSee = "DEFECT: لم يُرسل رد أدمن";
    if (await ta.count()) {
      const marker = `fallback-f11-${Date.now()}`;
      await ta.fill(marker);
      await page.locator(".rad-sendb").first().click();
      // toast or inline notice
      const notice = page.getByText(
        /أُرسل عبر المنصة|عبر المنصة|platform|fallback|تحويل|سيظهر عند التاجر/i
      );
      await Promise.race([
        notice.first().waitFor({ state: "visible", timeout: 8000 }).catch(() => null),
        page.waitForTimeout(8000),
      ]);
      const noticeText = (await notice.count())
        ? (await notice.first().innerText()).trim().slice(0, 100)
        : "";
      const outBubble = page.locator(".rad-bb").filter({ hasText: marker }).first();
      const chip = outBubble.locator(".rad-chchip, .rad-chipl").first();
      const chipText = (await chip.count())
        ? (await chip.innerText()).trim()
        : "";
      if (noticeText || /منصة|platform/i.test(chipText)) {
        fallbackSee = `fallback حقيقي: إشعار «${noticeText || "(لا توست)"}»؛ فقاعة صادرة بشارة «${chipText || "؟"}» للنص ${marker}`;
      } else {
        fallbackSee = `DEFECT fallback: لا إشعار منصة بعد الإرسال؛ chip=${chipText || "none"}؛ قد يكون واتساب متصلاً محلياً`;
      }
    }
    await shot(page, "05-admin-fallback-or-channel.png", fallbackSee);

    const conflictId =
      conflict.conflictConversationId || conflict.aPhoneConversationId;
    if (conflictId) {
      const widths = [1440, 1280, 768, 390];
      let allOk = true;
      const overlapNotes = [];
      for (const w of widths) {
        await page.setViewportSize({
          width: w,
          height: w <= 390 ? 844 : 900,
        });
        await page.goto(`${BASE}/admin/inbox/${conflictId}`, {
          waitUntil: "domcontentloaded",
        });
        await page.locator(".rad-th .rad-tt > b").waitFor({ timeout: 15000 });
        await page.waitForTimeout(400);
        const g = await gateHeaderNoOverlap(page);
        console.log(`GATE header-${w}`, JSON.stringify(g));
        if (!g.ok) allOk = false;
        overlapNotes.push(`${w}:${g.ok ? "ok" : "OVERLAP"}`);
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE}/admin/inbox/${conflictId}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(500);
      const conflictChip = page.getByText(/تعارض هاتف|Phone conflict/i).first();
      const rawSlug = await page.getByText("phone-conflict", { exact: true }).count();
      await shot(
        page,
        "06-admin-phone-conflict.png",
        allOk && rawSlug === 0
          ? `ترويسة بلا تداخل (${overlapNotes.join(", ")})؛ شارة عربية ظاهرة؛ لا slug خام`
          : `DEFECT ترويسة/وسم: gates=${overlapNotes.join(", ")} rawSlug=${rawSlug} chipVisible=${await conflictChip.count()}`
      );
    }

    await page.goto(`${BASE}/admin/inbox`, { waitUntil: "domcontentloaded" });
    await page.locator(".rad-fl").first().waitFor({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    const fl = await page.locator(".rad-fl").first().evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        overflowX: style.overflowX,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        wrap: style.flexWrap,
      };
    }).catch(() => null);
    await shot(
      page,
      "06b-admin-list-conflict.png",
      fl
        ? `شريط فلاتر: overflowX=${fl.overflowX} wrap=${fl.wrap} scroll=${fl.scrollWidth}>${fl.clientWidth}=${fl.scrollWidth > fl.clientWidth}`
        : "قائمة الصندوق"
    );
    await page.close();
  }

  await browser.close();

  const issuesPath = path.join(OUT, "CONSOLE-ISSUES.md");
  const issueLines =
    consoleIssues.length === 0
      ? ["(none captured)"]
      : consoleIssues.map(
          (i, n) =>
            `${n + 1}. [${i.label}] ${i.kind}: ${i.text}${i.stack ? ` — ${i.stack}` : ""}`
        );
  fs.writeFileSync(
    issuesPath,
    `# Console issues during CHAT-F1.1 owner shots\n\n${issueLines.join("\n")}\n`,
    "utf8"
  );

  fs.writeFileSync(
    path.join(OUT, "NOTES.md"),
    notes.map((n) => `- **${n.file}:** ${n.see}`).join("\n") +
      "\n\n## Console\n" +
      issueLines.map((l) => `- ${l}`).join("\n") +
      "\n",
    "utf8"
  );
  console.log("owner shots done →", OUT);
  console.log("console issues:", consoleIssues.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
