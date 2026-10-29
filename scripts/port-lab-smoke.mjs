/**
 * Smoke routes after design-lab → real port.
 * Usage: node scripts/port-lab-smoke.mjs [baseUrl]
 */
const base = process.argv[2] || "http://localhost:3000";

const paths = [
  "/",
  "/admin/login",
  "/trader/login",
  "/admin/brokerage",
  "/trader/brokerage",
  "/trader/brokerage/new",
];

let failed = 0;
for (const p of paths) {
  const url = `${base}${p}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? "OK" : "FAIL"} ${res.status} ${p}`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`FAIL ERR ${p} ${e.message}`);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
