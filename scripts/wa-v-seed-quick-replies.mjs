/** @deprecated use scripts/wa-v-seed-quick-replies.ts via npx tsx */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("npx", ["tsx", "scripts/wa-v-seed-quick-replies.ts"], {
  cwd: ROOT,
  encoding: "utf8",
  shell: true,
  env: process.env,
  stdio: "inherit",
});
process.exit(r.status ?? 1);
