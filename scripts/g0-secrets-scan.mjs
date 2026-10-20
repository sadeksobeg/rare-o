/**
 * G0: refuse push of real secrets / runtime auth / DB dumps.
 * Exit 0 = clean; exit 1 = findings.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tracked = execSync("git ls-files", { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const BAD_PATH = [
  /(^|\/)\.env$/i,
  /(^|\/)\.env\.(local|production|development)$/i,
  /(^|\/)wa-auth\//i,
  /(^|\/)backups\//i,
  /\.sqlite$/i,
  /(^|\/)dev\.db$/i,
  /\.pem$/i,
  /id_rsa$/i,
  /credentials\.json$/i,
];

const ALLOW = new Set([
  ".env.example",
  ".env.production.example",
  "lib/security/wa-auth-crypto.ts",
]);

const findings = [];
for (const f of tracked) {
  const norm = f.replace(/\\/g, "/");
  if (ALLOW.has(norm)) continue;
  if (BAD_PATH.some((re) => re.test(norm))) {
    findings.push({ file: norm, reason: "path pattern" });
  }
}

// Light content scan on small text files
const secretish =
  /(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9-]{10,}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)/;
for (const f of tracked) {
  if (!/\.(ts|tsx|js|mjs|json|yml|yaml|md|env|sh|sql)$/i.test(f)) continue;
  if (f.includes("node_modules")) continue;
  const abs = path.join(root, f);
  let body;
  try {
    const st = fs.statSync(abs);
    if (st.size > 500_000) continue;
    body = fs.readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  if (secretish.test(body)) {
    findings.push({ file: f.replace(/\\/g, "/"), reason: "content pattern" });
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  trackedFiles: tracked.length,
  findings,
  pass: findings.length === 0,
};
fs.mkdirSync(path.join(root, "docs/pro-readiness"), { recursive: true });
fs.writeFileSync(
  path.join(root, "docs/pro-readiness/G0-SECRETS-SCAN.json"),
  JSON.stringify(out, null, 2)
);
console.log(JSON.stringify(out, null, 2));
process.exit(findings.length ? 1 : 0);
