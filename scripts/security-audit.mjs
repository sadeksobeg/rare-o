#!/usr/bin/env node
/**
 * npm audit wrapper for CI / release gates.
 * Run: npm run security:audit
 */
import { execSync } from "node:child_process";

const level = process.env.NPM_AUDIT_LEVEL || "high";

try {
  execSync(`npm audit --audit-level=${level}`, {
    stdio: "inherit",
    env: process.env,
  });
  console.log("security-audit: OK");
} catch {
  console.error(`security-audit: findings at or above ${level}`);
  process.exit(1);
}
