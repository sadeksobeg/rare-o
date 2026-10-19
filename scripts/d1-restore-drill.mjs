/**
 * D1 restore drill: snapshot dev.db + uploads + .wa-auth → backups/restore-drill-{ts}/,
 * sha256 checksums, file counts, docs/pro-readiness/RESTORE-DRILL.json
 */
import {
  cpSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const ts = Date.now();
const drillDir = path.join(root, "backups", `restore-drill-${ts}`);

function copyTree(rel, destName) {
  const src = path.join(root, rel);
  if (!existsSync(src)) return { copied: false, rel };
  const dest = path.join(drillDir, destName);
  cpSync(src, dest, { recursive: true });
  return { copied: true, rel, dest: path.relative(root, dest) };
}

function walkFiles(dir, base = dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkFiles(full, base));
    } else {
      out.push({
        path: path.relative(base, full).replace(/\\/g, "/"),
        bytes: st.size,
      });
    }
  }
  return out;
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (d) => hash.update(d));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

async function main() {
  const srcDb = path.join(root, "prisma", "dev.db");
  if (!existsSync(srcDb)) {
    console.error("FAIL: prisma/dev.db missing");
    process.exit(1);
  }

  mkdirSync(drillDir, { recursive: true });

  const copies = [
    copyTree("prisma/dev.db", "dev.db"),
    copyTree("public/uploads", "uploads"),
    copyTree(process.env.WHATSAPP_AUTH_DIR || ".wa-auth", "wa-auth"),
  ];

  const files = walkFiles(drillDir);
  const checksums = {};
  for (const f of files) {
    const full = path.join(drillDir, f.path);
    checksums[f.path] = await sha256File(full);
  }

  const report = {
    ok: true,
    at: new Date().toISOString(),
    backupDir: path.relative(root, drillDir),
    copies: copies.map((c) =>
      c.copied ? { source: c.rel, dest: c.dest } : { source: c.rel, skipped: true }
    ),
    fileCount: files.length,
    totalBytes: files.reduce((n, f) => n + f.bytes, 0),
    checksums,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
  };

  const reportPath = path.join(root, "docs", "pro-readiness", "RESTORE-DRILL.json");
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("RESTORE DRILL OK");
  console.log(`  dir: ${report.backupDir}`);
  console.log(`  files: ${report.fileCount} (${report.totalBytes} bytes)`);
  console.log(`  report → ${path.relative(root, reportPath)}`);
  for (const c of copies) {
    console.log(`  ${c.copied ? "copied" : "skip"}: ${c.rel}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
