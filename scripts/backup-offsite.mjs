#!/usr/bin/env node
/**
 * Encrypted off-site backup stub — documents rclone; supports dry-run only.
 *
 * Production pattern:
 *   1. npm run backup:daily  (local encrypted dump in backups/daily-*)
 *   2. rclone sync backups/ remote:rare-oud-backups --dry-run
 *
 * Env:
 *   BACKUP_OFFSITE_REMOTE  e.g. s3:bucket/path or gdrive:folder
 *   RCLONE_CONFIG          path to rclone.conf (never commit)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dryRun = process.argv.includes("--dry-run") || process.env.BACKUP_DRY_RUN === "1";
const remote = process.env.BACKUP_OFFSITE_REMOTE?.trim();
const backupsDir = path.resolve(process.cwd(), "backups");

console.log("# Rare Oud off-site backup (stub)");
console.log("# Requires: rclone configured with server-side encryption (crypt remote recommended)");
console.log(`# Local dir: ${backupsDir}`);
console.log(`# Remote: ${remote || "(set BACKUP_OFFSITE_REMOTE)"}`);

if (!fs.existsSync(backupsDir)) {
  console.warn("backups/ missing — run npm run backup:daily first");
}

if (!remote) {
  console.log("\nDry-run documentation only (no BACKUP_OFFSITE_REMOTE).");
  console.log("Example:");
  console.log(
    "  BACKUP_OFFSITE_REMOTE=crypt-remote:rare-oud npm run backup:offsite -- --dry-run"
  );
  process.exit(0);
}

const flag = dryRun ? "--dry-run" : "";
const cmd = `rclone sync ${JSON.stringify(backupsDir)} ${JSON.stringify(remote)} ${flag} --progress`.trim();

console.log(`\nWould execute: ${cmd}`);

if (dryRun) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    console.error("rclone dry-run failed (install rclone and configure remote)");
    process.exit(1);
  }
} else {
  console.error("Live sync disabled in stub — pass --dry-run or set BACKUP_DRY_RUN=1");
  process.exit(2);
}
