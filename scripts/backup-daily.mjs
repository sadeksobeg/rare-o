/**
 * Daily backup: SQLite DB + public/uploads + WhatsApp auth dir (if present).
 * Restore drill: stop app/worker → restore dirs → start → hit /api/health.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
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

copyIfExists("prisma/dev.db", "dev.db");
copyIfExists("public/uploads", "uploads");
copyIfExists(process.env.WHATSAPP_AUTH_DIR || ".wa-auth", "wa-auth");

console.log(`backup-daily OK → ${out}`);
