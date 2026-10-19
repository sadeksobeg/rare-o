/**
 * Keep only the newest BACKUP_RETENTION_DAYS (default 7) daily-* folders under backups/.
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dir = path.join(root, "backups");
const days = Math.max(1, Number(process.env.BACKUP_RETENTION_DAYS || 7) || 7);

if (!existsSync(dir)) {
  console.log("backup-prune: no backups/ dir — nothing to do");
  process.exit(0);
}

const entries = readdirSync(dir)
  .filter((name) => name.startsWith("daily-"))
  .map((name) => {
    const full = path.join(dir, name);
    return { name, full, mtime: statSync(full).mtimeMs };
  })
  .sort((a, b) => b.mtime - a.mtime);

const keep = entries.slice(0, days);
const drop = entries.slice(days);

for (const e of drop) {
  rmSync(e.full, { recursive: true, force: true });
  console.log(`backup-prune: removed ${e.name}`);
}

console.log(
  `backup-prune OK — kept ${keep.length}, removed ${drop.length} (retention=${days})`
);
