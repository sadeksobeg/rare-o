/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Prisma delegates per model */
/**
 * D2: one-time copy of every table from a SQLite file into PostgreSQL.
 *
 *   npm run db:migrate-sqlite-pg -- [--sqlite prisma/dev.db] [--truncate] [--report path.json]
 *   npm run test:migrate-sqlite-pg            (self-test: temp database, copy, verify, drop)
 *
 * - Source is read with Node's built-in `node:sqlite` (no extra dependency).
 * - Target is the Prisma client generated for provider "postgresql" (DATABASE_URL, postgres://).
 * - Tables are discovered from the Prisma DMMF and copied in FK-dependency order.
 * - Verification: per-table row count AND an order-independent hash of primary keys.
 * - Exit code 0 only if every table matches.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { Prisma, PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
// node:sqlite is experimental in Node 22 — silence only that warning.
process.removeAllListeners("warning");
process.on("warning", (w) => {
  if (w.name !== "ExperimentalWarning") console.warn(w);
});
// @types/node@20 has no typings for node:sqlite (Node >= 22.5 required at runtime).
const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: new (p: string, o?: { readOnly?: boolean }) => any };

const root = process.cwd();
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const opt = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

type Row = Record<string, unknown>;
type ModelMeta = (typeof Prisma.dmmf.datamodel.models)[number];

const models = Prisma.dmmf.datamodel.models as readonly ModelMeta[];

/** Order models so that every FK parent comes before its children. */
function orderModels(): ModelMeta[] {
  const byName = new Map(models.map((m) => [m.name, m]));
  const deps = new Map<string, Set<string>>();
  for (const m of models) {
    const d = new Set<string>();
    for (const f of m.fields) {
      if (f.kind === "object" && f.relationFromFields && f.relationFromFields.length > 0) {
        if (f.type !== m.name) d.add(f.type);
      }
    }
    deps.set(m.name, d);
  }
  const out: ModelMeta[] = [];
  const done = new Set<string>();
  while (out.length < models.length) {
    let progressed = false;
    for (const m of models) {
      if (done.has(m.name)) continue;
      if ([...(deps.get(m.name) ?? [])].every((x) => done.has(x))) {
        out.push(byName.get(m.name)!);
        done.add(m.name);
        progressed = true;
      }
    }
    if (!progressed) throw new Error("Cyclic FK dependency between models");
  }
  return out;
}

function delegateName(model: string) {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function convert(field: ModelMeta["fields"][number], v: unknown): unknown {
  if (v === null || v === undefined) return null;
  switch (field.type) {
    case "DateTime": {
      if (typeof v === "number" || typeof v === "bigint") return new Date(Number(v));
      const s = String(v);
      if (/^-?\d+(\.\d+)?$/.test(s)) return new Date(Number(s));
      return new Date(s);
    }
    case "Boolean":
      return v === 1 || v === BigInt(1) || v === true || v === "1" || v === "true";
    case "Int":
      return Number(v);
    case "BigInt":
      return BigInt(v as string | number | bigint);
    case "Float":
      return Number(v);
    case "Decimal":
      return String(v);
    default:
      return String(v);
  }
}

function hashIds(ids: string[]) {
  const h = createHash("sha256");
  for (const id of [...ids].sort()) h.update(id + "\n");
  return h.digest("hex").slice(0, 16);
}

interface TableReport {
  table: string;
  sqlite: number;
  postgres: number;
  sqliteIdHash: string;
  postgresIdHash: string;
  ok: boolean;
  note?: string;
}

function assertPostgresUrl(url: string | undefined) {
  if (!url || !/^postgres(ql)?:\/\//.test(url)) {
    throw new Error(
      "DATABASE_URL must be a postgres:// URL (target). Example: postgresql://rareoud:rareoud@localhost:5432/rareoud?schema=public"
    );
  }
}

async function copyAndVerify(opts: {
  sqlitePath: string;
  prisma: PrismaClient;
  truncate: boolean;
}): Promise<TableReport[]> {
  const { sqlitePath, prisma, truncate } = opts;
  if (!existsSync(sqlitePath)) throw new Error(`SQLite file not found: ${sqlitePath}`);
  const src = new DatabaseSync(sqlitePath, { readOnly: true });
  const srcTables = new Set(
    (src.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Row[]).map((r) =>
      String(r.name)
    )
  );
  const ordered = orderModels();

  // Guard: target must be empty unless --truncate
  const existing: Record<string, number> = {};
  for (const m of ordered) {
    existing[m.name] = await (prisma as any)[delegateName(m.name)].count();
  }
  const nonEmpty = Object.entries(existing).filter(([, n]) => n > 0);
  if (nonEmpty.length > 0) {
    if (!truncate) {
      throw new Error(
        `Target Postgres is not empty (${nonEmpty.map(([k, n]) => `${k}=${n}`).join(", ")}). Re-run with --truncate to wipe target tables first.`
      );
    }
    for (const m of [...ordered].reverse()) {
      await (prisma as any)[delegateName(m.name)].deleteMany();
    }
    console.log("target tables truncated");
  }

  const reports: TableReport[] = [];
  for (const m of ordered) {
    const delegate = (prisma as any)[delegateName(m.name)];
    const scalarFields = m.fields.filter((f) => f.kind === "scalar" || f.kind === "enum");
    const idField = m.fields.find((f) => f.isId)?.name ?? "id";

    if (!srcTables.has(m.name)) {
      const pgCount = await delegate.count();
      reports.push({
        table: m.name,
        sqlite: 0,
        postgres: pgCount,
        sqliteIdHash: hashIds([]),
        postgresIdHash: hashIds([]),
        ok: pgCount === 0,
        note: "table missing in SQLite source",
      });
      continue;
    }

    const rows = src.prepare(`SELECT * FROM "${m.name}"`).all() as Row[];
    const data = rows.map((r) => {
      const o: Row = {};
      for (const f of scalarFields) {
        if (f.name in r) o[f.name] = convert(f, r[f.name]);
        else if (f.hasDefaultValue) continue;
        else o[f.name] = null;
      }
      return o;
    });

    const CHUNK = 500;
    for (let i = 0; i < data.length; i += CHUNK) {
      await delegate.createMany({ data: data.slice(i, i + CHUNK) });
    }

    const pgIds = (await delegate.findMany({ select: { [idField]: true } })) as Row[];
    const pgCount = pgIds.length;
    const srcIds = rows.map((r) => String(r[idField]));
    const sh = hashIds(srcIds);
    const ph = hashIds(pgIds.map((r) => String(r[idField])));
    reports.push({
      table: m.name,
      sqlite: rows.length,
      postgres: pgCount,
      sqliteIdHash: sh,
      postgresIdHash: ph,
      ok: rows.length === pgCount && sh === ph,
    });
  }
  src.close();
  return reports;
}

function printReport(reports: TableReport[]) {
  const w = Math.max(...reports.map((r) => r.table.length), 5);
  console.log(`\n${"table".padEnd(w)}  sqlite  postgres  ids   status`);
  for (const r of reports) {
    console.log(
      `${r.table.padEnd(w)}  ${String(r.sqlite).padStart(6)}  ${String(r.postgres).padStart(8)}  ${
        r.sqliteIdHash === r.postgresIdHash ? "match" : "DIFF "
      } ${r.ok ? "OK" : "FAIL"}${r.note ? `  (${r.note})` : ""}`
    );
  }
  const total = reports.reduce((n, r) => n + r.sqlite, 0);
  const bad = reports.filter((r) => !r.ok);
  console.log(
    `\nTOTAL rows (sqlite): ${total}; tables: ${reports.length}; failed: ${bad.length}`
  );
  console.log(bad.length === 0 ? "MIGRATION VERIFIED OK" : "MIGRATION VERIFICATION FAILED");
}

function writeReport(reports: TableReport[], file: string, extra: Record<string, unknown> = {}) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(
    file,
    JSON.stringify({ at: new Date().toISOString(), ok: reports.every((r) => r.ok), ...extra, tables: reports }, null, 2)
  );
  console.log(`report → ${path.relative(root, file)}`);
}

function withDb(url: string, db: string) {
  const u = new URL(url);
  u.pathname = "/" + db;
  return u.toString();
}

async function selfTest(sqlitePath: string) {
  const baseUrl = process.env.DATABASE_URL;
  assertPostgresUrl(baseUrl);
  const tmpDb = `rareoud_migtest_${Date.now()}`;
  const tmpUrl = withDb(baseUrl!, tmpDb);
  const admin = new PrismaClient({ datasources: { db: { url: baseUrl! } } });
  let target: PrismaClient | undefined;
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${tmpDb}"`);
    console.log(`created temp database ${tmpDb}`);
    const dep = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { cwd: root, env: { ...process.env, DATABASE_URL: tmpUrl }, encoding: "utf8" }
    );
    if (dep.status !== 0) throw new Error("migrate deploy failed on temp DB:\n" + dep.stdout + dep.stderr);
    console.log("migrate deploy OK on temp database");
    target = new PrismaClient({ datasources: { db: { url: tmpUrl } } });
    const reports = await copyAndVerify({ sqlitePath, prisma: target, truncate: true });
    printReport(reports);
    const out = path.join(root, "tmp", "d2-migrate-selftest-report.json");
    writeReport(reports, out, { mode: "self-test", tempDatabase: tmpDb });
    if (!reports.every((r) => r.ok)) process.exitCode = 1;
    else console.log("SELF-TEST PASS");
  } finally {
    await target?.$disconnect();
    try {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${tmpDb}" WITH (FORCE)`);
      console.log(`dropped temp database ${tmpDb}`);
    } catch (e) {
      console.warn("could not drop temp database:", (e as Error).message);
    }
    await admin.$disconnect();
  }
}

async function main() {
  const sqliteRel = opt("--sqlite") ?? "prisma/dev.db";
  const sqlitePath = path.resolve(root, sqliteRel);

  if (flag("--self-test")) {
    // Work on a copy so the live file is never touched.
    if (!existsSync(sqlitePath)) {
      console.log(`SKIP: SQLite source ${sqliteRel} not found — nothing to self-test.`);
      return;
    }
    const copy = path.join(root, "tmp", "d2-selftest-source.db");
    mkdirSync(path.dirname(copy), { recursive: true });
    copyFileSync(sqlitePath, copy);
    try {
      await selfTest(copy);
    } finally {
      rmSync(copy, { force: true });
    }
    return;
  }

  assertPostgresUrl(process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  try {
    console.log(`source: ${sqliteRel}`);
    const reports = await copyAndVerify({ sqlitePath, prisma, truncate: flag("--truncate") });
    printReport(reports);
    const out = opt("--report")
      ? path.resolve(root, opt("--report")!)
      : path.join(root, "docs", "pro-readiness", "D2-MIGRATION-REPORT.json");
    writeReport(reports, out, { mode: "migrate", source: sqliteRel });
    if (!reports.every((r) => r.ok)) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
