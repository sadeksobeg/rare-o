/**
 * Production First Load JS after V2 icons. Updates js-sizes-prod.json.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseFirstLoadJs, pickRoutes } from "./record-first-load-js.mjs";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs/visual/baseline/js-sizes-prod.json");

const env = {
  ...process.env,
  SKIP_SITE_ENV_CHECK: "1",
  NODE_OPTIONS: "--max-old-space-size=6144",
  NEXT_CPU_COUNT: "1",
};

const r = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  { cwd: ROOT, encoding: "utf8", env, maxBuffer: 20 * 1024 * 1024 }
);
const stdout = `${r.stdout || ""}\n${r.stderr || ""}`;
fs.writeFileSync(path.join(ROOT, "docs/visual/baseline/build-icons.log"), stdout);
if (r.status !== 0) {
  fs.writeFileSync(
    path.join(ROOT, "docs/visual/baseline/build-icons-error.txt"),
    `status ${r.status}\n${stdout.slice(-4000)}`
  );
  process.exit(r.status || 1);
}

const picked = pickRoutes(parseFirstLoadJs(stdout));
const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
const iconDeltaKb = {};
for (const name of Object.keys(prev.after || {})) {
  const a = picked[name]?.firstLoadKb;
  const b = prev.after[name]?.firstLoadKb;
  iconDeltaKb[name] =
    a != null && b != null ? Math.round((a - b) * 100) / 100 : null;
}
prev.iconsAfter = picked;
prev.iconDeltaKb = iconDeltaKb;
prev.iconsAt = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(prev, null, 2));
console.log("iconDeltaKb", iconDeltaKb);
