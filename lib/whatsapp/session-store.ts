/**
 * Secure WhatsApp session storage abstraction.
 *
 * Auth material is a high-value secret:
 * - never commit to Git
 * - never expose to browser / API / logs
 * - store outside public web roots
 *
 * Default local path: ./.wa-auth (gitignored)
 * Production (VPS): WHATSAPP_AUTH_DIR=/var/lib/rare-oud/whatsapp-auth
 */

import fs from "node:fs";
import path from "node:path";

export type WhatsAppSessionStoreConfig = {
  /** Absolute or project-relative directory for Baileys multi-file auth */
  authDir: string;
};

export function resolveWhatsAppAuthDir(
  cwd: string = process.cwd()
): string {
  const fromEnv = process.env.WHATSAPP_AUTH_DIR?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(cwd, fromEnv);
  }
  // Local development default — still private to the process, never under public/
  return path.resolve(cwd, ".wa-auth");
}

export function createSessionStoreConfig(
  cwd: string = process.cwd()
): WhatsAppSessionStoreConfig {
  return { authDir: resolveWhatsAppAuthDir(cwd) };
}

/**
 * Ensures the auth directory exists with restrictive permissions when possible.
 * Does not create session credentials — only the empty container directory.
 */
export function ensureAuthDir(authDir: string): void {
  const resolved = path.resolve(authDir);

  assertAuthDirNotPublic(resolved);

  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true, mode: 0o700 });
  }

  try {
    fs.chmodSync(resolved, 0o700);
  } catch {
    // Windows may not support POSIX chmod; directory still must not be public/
  }
}

/**
 * Refuse auth dirs that would be web-served or committed under public assets.
 */
export function assertAuthDirNotPublic(authDir: string): void {
  const resolved = path.resolve(authDir).replace(/\\/g, "/").toLowerCase();
  const forbidden = [
    "/public/",
    "\\public\\",
    "/.next/",
    "/node_modules/",
  ];
  for (const part of forbidden) {
    if (resolved.includes(part.replace(/\\/g, "/")) || resolved.endsWith("/public")) {
      throw new Error(
        `WHATSAPP_AUTH_DIR_UNSAFE: auth directory must not live under web/public paths (${authDir})`
      );
    }
  }
}

export function authDirExists(authDir: string): boolean {
  try {
    return fs.existsSync(authDir) && fs.statSync(authDir).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Returns whether any auth state files appear present (without reading secrets).
 * Used only for health hints — never log file contents.
 */
export function hasAuthStateFiles(authDir: string): boolean {
  if (!authDirExists(authDir)) return false;
  try {
    const entries = fs.readdirSync(authDir);
    return entries.some((name) => name.startsWith("creds") || name.endsWith(".json"));
  } catch {
    return false;
  }
}
