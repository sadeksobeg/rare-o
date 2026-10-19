/**
 * Daily backup: database (PostgreSQL via pg_dump, or SQLite file) + public/uploads + WhatsApp auth dir.
 *
 * DATABASE_URL = postgres(ql)://…  → backups/daily-<stamp>/db.dump   (pg_dump -Fc)
 * DATABASE_URL = file:…  (or unset) → backups/daily-<stamp>/dev.db   (SQLite file copy)
 *
 * pg_dump runs from PATH if available, otherwise `docker exec <POSTGRES_CONTAINER>` (default rare-oud-postgres).
 * Restore drill: stop app/worker → restore DB + dirs → start → hit /api/health.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { isPostgresUrl, pgDump, pgMode } from "./lib/pg-tools.mjs";

const root = process.cwd();

// Minimal .env loader (no dependency) — real environment wins.
const envFile = path.join(root, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = path.join(root, "backups", `daily-${stamp}`);
mkdirSync(out, { recursive: true });

function copyIfExists(rel, destName) {
  const src = path.join(root, rel);
  if (!existsSync(src)) {
    console.log(`skip missing: ${rel}`);
    return;
  }
  const dest = path.join(out, destName);
  cpSync(src, dest, { recursive: true });
  console.log(`copied ${rel} → ${destName}`);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (isPostgresUrl(dbUrl)) {
    const dumpFile = path.join(out, "db.dump");
    await pgDump(dbUrl, dumpFile);
    console.log(`pg_dump (${pgMode()}) → db.dump (${statSync(dumpFile).size} bytes)`);
  } else {
    copyIfExists("prisma/dev.db", "dev.db");
  }
  copyIfExists("public/uploads", "uploads");
  copyIfExists(process.env.WHATSAPP_AUTH_DIR || ".wa-auth", "wa-auth");
  console.log(`backup-daily OK → ${out}`);
}

main().catch((e) => {
  console.error("backup-daily FAILED:", e.message);
  process.exit(1);
});
