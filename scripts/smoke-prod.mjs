/**
 * Production smoke against a live base URL (Caddy/HTTPS or direct).
 *
 * Usage: npm run smoke:prod -- https://DOMAIN
 * Checks: /api/health, home, catalog, admin login, security headers, HTTPS redirect (when https).
 */
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    timeout: { type: "string", default: "15000" },
  },
});

const baseRaw = positionals[0] || process.env.SMOKE_BASE_URL;
if (!baseRaw) {
  console.error("Usage: npm run smoke:prod -- https://DOMAIN");
  process.exit(2);
}

const base = baseRaw.replace(/\/$/, "");
const timeout = Number(values.timeout) || 15_000;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL: ${name} — ${e.message}`);
  }
}

async function fetchText(url, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...init,
      redirect: init.redirect ?? "manual",
      signal: ctrl.signal,
      headers: { "user-agent": "rare-oud-smoke/1.0", ...(init.headers || {}) },
    });
    const text = await res.text().catch(() => "");
    return { res, text };
  } finally {
    clearTimeout(t);
  }
}

await check("health JSON ok", async () => {
  const { res, text } = await fetchText(`${base}/api/health`, { redirect: "follow" });
  if (!res.ok) throw new Error(`status ${res.status}`);
  const body = JSON.parse(text);
  if (!body.ok) throw new Error(`body=${text.slice(0, 200)}`);
});

await check("home 200", async () => {
  const { res } = await fetchText(`${base}/?lang=ar`, { redirect: "follow" });
  if (res.status !== 200) throw new Error(`status ${res.status}`);
});

await check("catalog 200", async () => {
  const { res } = await fetchText(`${base}/catalog?lang=ar`, { redirect: "follow" });
  if (res.status !== 200) throw new Error(`status ${res.status}`);
});

await check("admin login 200", async () => {
  const { res, text } = await fetchText(`${base}/admin/login`, { redirect: "follow" });
  if (res.status !== 200) throw new Error(`status ${res.status}`);
  if (!/password|كلمة|login|تسجيل/i.test(text)) {
    throw new Error("login page missing expected copy");
  }
});

await check("security headers present", async () => {
  const { res } = await fetchText(`${base}/`, { redirect: "follow" });
  const h = res.headers;
  const need = ["x-frame-options", "x-content-type-options", "referrer-policy"];
  for (const key of need) {
    if (!h.get(key)) throw new Error(`missing ${key}`);
  }
});

if (base.startsWith("https://")) {
  const httpBase = base.replace(/^https:/, "http:");
  await check("HTTP→HTTPS redirect", async () => {
    const { res } = await fetchText(`${httpBase}/`, { redirect: "manual" });
    if (![301, 302, 307, 308].includes(res.status)) {
      throw new Error(`expected redirect, got ${res.status}`);
    }
    const loc = res.headers.get("location") || "";
    if (!loc.startsWith("https://")) {
      throw new Error(`location not https: ${loc}`);
    }
  });
} else {
  console.log("SKIP: HTTP→HTTPS redirect (base is not https)");
}

if (failed) {
  console.error(`\nsmoke:prod FAIL (${failed})`);
  process.exit(1);
}
console.log("\nsmoke:prod PASS");
