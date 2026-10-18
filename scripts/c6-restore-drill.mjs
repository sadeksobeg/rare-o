/**
 * C6 restore drill: copy live SQLite to a temp DB path, open with Prisma,
 * print row counts, verify readable. Does not overwrite production DB.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const root = process.cwd();
const srcDb = path.join(root, "prisma", "dev.db");
const drillDir = path.join(root, "backups", `restore-drill-${Date.now()}`);
const destDb = path.join(drillDir, "restored.db");

if (!existsSync(srcDb)) {
  console.error("FAIL: prisma/dev.db missing — run migrate/seed first");
  process.exit(1);
}

mkdirSync(drillDir, { recursive: true });
cpSync(srcDb, destDb);
console.log(`copied ${srcDb} → ${destDb}`);

const reportPath = path.join(
  root,
  "docs",
  "pro-readiness",
  "RESTORE-DRILL.json"
);
mkdirSync(path.dirname(reportPath), { recursive: true });

const url = `file:${destDb.replace(/\\/g, "/")}`;
process.env.DATABASE_URL = url;

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

try {
  const [products, deals, retail, traders, waConv] = await Promise.all([
    prisma.product.count(),
    prisma.dealProposal.count(),
    prisma.retailRequest.count(),
    prisma.traderAccount.count(),
    prisma.whatsAppConversation.count(),
  ]);
  const report = {
    ok: true,
    at: new Date().toISOString(),
    source: "prisma/dev.db",
    restoredPath: path.relative(root, destDb),
    counts: { products, deals, retail, traders, waConv },
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log("RESTORE DRILL OK", report.counts);
  console.log(`report → ${path.relative(root, reportPath)}`);
} catch (e) {
  const report = {
    ok: false,
    at: new Date().toISOString(),
    error: e instanceof Error ? e.message : String(e),
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error("RESTORE DRILL FAIL", report.error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  // Keep restored copy for inspection; comment next line to retain forever
  // rmSync(drillDir, { recursive: true, force: true });
}

// Touch health via running app if available (non-fatal)
try {
  const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
  const out = execSync(`node -e "fetch('${base}/api/health').then(r=>r.json()).then(j=>console.log(JSON.stringify(j))).catch(e=>{console.error(e);process.exit(1)})"`, {
    encoding: "utf8",
    timeout: 10_000,
  });
  console.log("live /api/health:", out.trim());
} catch {
  console.log("live /api/health: skipped (server not reachable)");
}
