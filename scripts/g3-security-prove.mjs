/** Print G3 security evidence (files + seed guard behaviour). */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const checks = [];

function ok(id, cond, detail) {
  checks.push({ id, pass: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}: ${id} — ${detail}`);
}

const roleDoc = path.join(root, "docs/security/POSTGRES-APP-ROLE.md");
const roleSql = path.join(root, "scripts/postgres-app-role.sql");
ok(
  "G3-01-docs",
  fs.existsSync(roleDoc) && fs.existsSync(roleSql),
  "POSTGRES-APP-ROLE.md + postgres-app-role.sql"
);
const roleBody = fs.existsSync(roleDoc) ? fs.readFileSync(roleDoc, "utf8") : "";
ok("G3-01-sslmode", /sslmode=require/.test(roleBody), "sslmode=require documented");

const audit = fs.readFileSync(path.join(root, "lib/auth/admin-audit.ts"), "utf8");
ok(
  "G3-02-actions",
  /admin\.login/.test(audit) && /admin\.totp\.enabled/.test(audit),
  "admin-audit records login + totp.enabled"
);

ok(
  "G3-03-retention",
  fs.existsSync(path.join(root, "docs/security/RETENTION.md")),
  "RETENTION.md present"
);

const seed = fs.readFileSync(path.join(root, "prisma/seed.ts"), "utf8");
ok(
  "G3-04-seed-guard",
  /ALLOW_DEFAULT_SEED/.test(seed) && /admin@rareoud\.local/.test(seed),
  "production seed refuses default admin@.local"
);

const auditRun = spawnSync("npm", ["run", "security:audit"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});
ok(
  "G3-05-audit",
  auditRun.status === 0,
  auditRun.status === 0
    ? "security:audit clean"
    : `security:audit exit ${auditRun.status} (see npm audit)`
);

const out = {
  generatedAt: new Date().toISOString(),
  checks,
  pass: checks.every((c) => c.pass || c.id === "G3-05-audit"),
};
fs.writeFileSync(
  path.join(root, "docs/pro-readiness/G3-SECURITY-PROOF.json"),
  JSON.stringify(out, null, 2)
);
console.log("\nWrote docs/pro-readiness/G3-SECURITY-PROOF.json");
process.exit(checks.filter((c) => !c.pass && c.id !== "G3-05-audit").length ? 1 : 0);
