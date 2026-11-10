/**
 * Two production builds: MotionProvider off then on. Writes js-sizes-prod.json.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseFirstLoadJs, pickRoutes } from "./record-first-load-js.mjs";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/visual/baseline/js-sizes-prod.json");

function build(skipMotion) {
  const env = {
    ...process.env,
    SKIP_SITE_ENV_CHECK: "1",
    RO_SKIP_MOTION_PROVIDER: skipMotion ? "1" : "",
  };
  console.log(
    `[js-prod] next build skipMotion=${skipMotion ? "yes" : "no"}…`
  );
  const r = spawnSync(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build"],
    {
      cwd: ROOT,
      encoding: "utf8",
      env,
      maxBuffer: 20 * 1024 * 1024,
    }
  );
  const stdout = `${r.stdout || ""}\n${r.stderr || ""}`;
  const tag = skipMotion ? "before" : "after";
  fs.writeFileSync(
    path.join(ROOT, `docs/visual/baseline/build-${tag}.log`),
    stdout
  );
  if (r.status !== 0) {
    console.error(stdout.slice(-4000));
    throw new Error(`next build failed (${tag}) status ${r.status}`);
  }
  const all = parseFirstLoadJs(stdout);
  const picked = pickRoutes(all);
  console.log(`[js-prod] ${tag}`, JSON.stringify(picked, null, 2));
  return { all, picked };
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const before = build(true);
const after = build(false);

const delta = {};
for (const name of Object.keys(after.picked)) {
  const a = after.picked[name]?.firstLoadKb;
  const b = before.picked[name]?.firstLoadKb;
  delta[name] =
    a != null && b != null ? Math.round((a - b) * 100) / 100 : null;
}

const out = {
  at: new Date().toISOString(),
  unit: "kB First Load JS from next build",
  note: "before = RO_SKIP_MOTION_PROVIDER=1; after = MotionProvider in root layout. Icon delta is recorded separately in V2-REPORT.",
  before: before.picked,
  after: after.picked,
  deltaKb: delta,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log("[js-prod] wrote", OUT, "deltaKb", delta);
