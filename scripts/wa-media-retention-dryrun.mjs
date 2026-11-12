/**
 * W-D dry-run only — prints WhatsApp media counts/sizes. Never deletes.
 *   node scripts/wa-media-retention-dryrun.mjs [rootDir] [retentionDays]
 */
import fs from "node:fs";
import path from "node:path";

const root =
  process.argv[2] ||
  process.env.WA_MEDIA_ROOT ||
  path.join(process.cwd(), "storage", "uploads", "whatsapp");
const retentionDays = Number(process.argv[3] || process.env.WA_MEDIA_RETENTION_DAYS || 90);
const cutoff = Date.now() - retentionDays * 86400_000;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (name.isFile()) {
      const st = fs.statSync(p);
      acc.push({ path: p, bytes: st.size, mtimeMs: st.mtimeMs });
    }
  }
  return acc;
}

const files = walk(root);
const totalBytes = files.reduce((s, f) => s + f.bytes, 0);
const stale = files.filter((f) => f.mtimeMs < cutoff);
const staleBytes = stale.reduce((s, f) => s + f.bytes, 0);

const report = {
  root,
  retentionDays,
  cutoffIso: new Date(cutoff).toISOString(),
  fileCount: files.length,
  totalBytes,
  totalMiB: Math.round((totalBytes / 1048576) * 100) / 100,
  wouldDeleteCount: stale.length,
  wouldDeleteBytes: staleBytes,
  wouldDeleteMiB: Math.round((staleBytes / 1048576) * 100) / 100,
  dryRun: true,
  deleted: 0,
};

console.log(JSON.stringify(report, null, 2));
