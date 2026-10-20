/**
 * Fail when user-visible storefront dictionary strings contain PLACEHOLDER.
 * Usage: npm run check:placeholders
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tsx = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const runner = path.join(__dirname, "check-placeholder-run.ts");

const result = spawnSync(process.execPath, [tsx, runner], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status === null ? 1 : result.status);
