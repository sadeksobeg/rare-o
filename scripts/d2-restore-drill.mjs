/**
 * D2 restore drill (PostgreSQL):
 *   1. pg_dump -Fc of DATABASE_URL → backups/restore-drill-pg-<ts>/db.dump
 *   2. copy public/uploads + wa-auth dir, sha256 every file (source vs backup copy must match)
 *   3. create temp database, pg_restore into it, compare per-table row counts with the source
 *   4. drop temp database
 *   5. write docs/pro-readiness/D2-RESTORE-DRILL.json — exit 1 on any mismatch
 */
import {
  cpSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  isPostgresUrl,
  parseDatabaseUrl,
  pgDump,
  pgMode,
  pgRestore,
  psql,
  tableCounts,
} from "./lib/pg-tools.mjs";

const root = process.cwd();
const envFile = path.join(root, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const ts = Date.now();
const drillDir = path.join(root, "backups", `restore-drill-pg-${ts}`);

function walk(dir, base = dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).replace(/\\/g, "/"));
  }
  return out.sort();
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    const s = createReadStream(file);
    s.on("data", (d) => h.update(d));
    s.on("end", () => resolve(h.digest("hex")));
    s.on("error", reject);
  });
}

async function compareTree(srcRel, destName) {
  const src = path.join(root, srcRel);
  if (!existsSync(src)) return { source: srcRel, skipped: true, files: 0, mismatches: [] };
  const dest = path.join(drillDir, destName);
  cpSync(src, dest, { recursive: true });
  const files = walk(src);
  const mismatches = [];
  for (const f of files) {
    const a = await sha256(path.join(src, f));
    const b = existsSync(path.join(dest, f)) ? await sha256(path.join(dest, f)) : null;
    if (a !== b) mismatches.push(f);
  }
  return { source: srcRel, files: files.length, mismatches };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!isPostgresUrl(dbUrl)) {
    console.error("FAIL: DATABASE_URL is not a postgres:// URL (use scripts/d1-restore-drill.mjs for SQLite)");
    process.exit(1);
  }
  const srcDb = parseDatabaseUrl(dbUrl).database;
  const tmpDb = `rareoud_restore_${ts}`;
  mkdirSync(drillDir, { recursive: true });

  const report = { ok: false, at: new Date().toISOString(), tools: pgMode(), backupDir: path.relative(root, drillDir) };
  try {
    const dumpFile = path.join(drillDir, "db.dump");
    await pgDump(dbUrl, dumpFile);
    report.dump = { file: "db.dump", bytes: statSync(dumpFile).size, sha256: await sha256(dumpFile) };

    report.uploads = await compareTree("public/uploads", "uploads");
    report.waAuth = await compareTree(process.env.WHATSAPP_AUTH_DIR || ".wa-auth", "wa-auth");

    const before = tableCounts(dbUrl, srcDb);
    psql(dbUrl, srcDb, `CREATE DATABASE "${tmpDb}"`);
    try {
      await pgRestore(dbUrl, tmpDb, dumpFile);
      const after = tableCounts(dbUrl, tmpDb);
      const tables = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
      report.tables = tables.map((t) => ({
        table: t,
        source: before[t] ?? null,
        restored: after[t] ?? null,
        ok: before[t] === after[t],
      }));
    } finally {
      psql(dbUrl, srcDb, `DROP DATABASE IF EXISTS "${tmpDb}" WITH (FORCE)`);
    }

    const tablesOk = report.tables.length > 0 && report.tables.every((t) => t.ok);
    const mediaOk = report.uploads.mismatches.length === 0 && report.waAuth.mismatches.length === 0;
    report.ok = tablesOk && mediaOk;
  } catch (e) {
    report.error = e.message;
  }

  const reportPath = path.join(root, "docs", "pro-readiness", "D2-RESTORE-DRILL.json");
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(report.ok ? "D2 RESTORE DRILL OK" : "D2 RESTORE DRILL FAILED");
  if (report.error) console.log(`  error: ${report.error}`);
  console.log(`  tools: ${report.tools}; dir: ${report.backupDir}`);
  if (report.dump) console.log(`  dump: ${report.dump.bytes} bytes sha256=${report.dump.sha256.slice(0, 16)}…`);
  if (report.tables) {
    console.log(`  tables: ${report.tables.filter((t) => t.ok).length}/${report.tables.length} row counts match`);
    for (const t of report.tables.filter((t) => !t.ok)) console.log(`    MISMATCH ${t.table}: ${t.source} vs ${t.restored}`);
  }
  for (const k of ["uploads", "waAuth"]) {
    const r = report[k];
    if (r) console.log(`  ${k}: ${r.skipped ? "skipped (missing)" : `${r.files} files, ${r.mismatches.length} checksum mismatches`}`);
  }
  console.log(`  report → ${path.relative(root, reportPath)}`);
  process.exit(report.ok ? 0 : 1);
}

main();
