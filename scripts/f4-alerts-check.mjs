/** Local alert-rules smoke: hit health/ready/wa-heartbeat. */
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

async function hit(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "user-agent": "f4-alerts-check" },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { path, status: res.status, json };
}

const paths = ["/api/health", "/api/ready", "/api/wa-heartbeat"];
let failed = 0;
for (const p of paths) {
  try {
    const r = await hit(p);
    const ok = r.status < 500;
    console.log(`${ok ? "PASS" : "FAIL"}: ${p} → ${r.status}`);
    if (!ok) failed += 1;
  } catch (e) {
    console.error(`FAIL: ${p} — ${e.message}`);
    failed += 1;
  }
}
process.exit(failed ? 1 : 0);
