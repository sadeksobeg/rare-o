/**
 * At-rest encryption for Baileys multi-file auth under WHATSAPP_AUTH_DIR.
 * When WHATSAPP_AUTH_KEY is set (32-byte base64 or hex, or any string hashed to 32 bytes),
 * session JSON is stored as `<name>.waenc` and plaintext creds are removed after seal.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ENC_SUFFIX = ".waenc";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function authKeyMaterial(): Buffer | null {
  const raw = process.env.WHATSAPP_AUTH_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  try {
    const b64 = Buffer.from(raw, "base64");
    if (b64.length === 32) return b64;
  } catch {
    /* fall through */
  }
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

export function isWhatsAppAuthEncryptionEnabled(): boolean {
  return authKeyMaterial() !== null;
}

function encryptPlaintext(key: Buffer, plaintext: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

function decryptPayload(key: Buffer, payload: Buffer): Buffer {
  if (payload.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("WA_AUTH_DECRYPT: payload too short");
  }
  const iv = payload.subarray(0, IV_LEN);
  const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = payload.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/** Names of auth files Baileys may create (encrypt all non-waenc files). */
function isAuthPlaintextFile(name: string): boolean {
  if (name.endsWith(ENC_SUFFIX)) return false;
  return (
    name.startsWith("creds") ||
    name.endsWith(".json") ||
    name.includes("app-state") ||
    name.includes("session")
  );
}

/**
 * Decrypt `.waenc` blobs into their plaintext filenames for Baileys to read.
 * No-op when WHATSAPP_AUTH_KEY is unset.
 */
export function hydrateAuthDirFromEncrypted(authDir: string): void {
  const key = authKeyMaterial();
  if (!key || !fs.existsSync(authDir)) return;

  for (const name of fs.readdirSync(authDir)) {
    if (!name.endsWith(ENC_SUFFIX)) continue;
    const encPath = path.join(authDir, name);
    const plainName = name.slice(0, -ENC_SUFFIX.length);
    const plainPath = path.join(authDir, plainName);
    const payload = fs.readFileSync(encPath);
    const plain = decryptPayload(key, payload);
    fs.writeFileSync(plainPath, plain, { mode: 0o600 });
  }
}

/**
 * Encrypt plaintext auth files to `.waenc` and remove plaintext copies.
 */
export function sealAuthDirEncrypted(authDir: string): void {
  const key = authKeyMaterial();
  if (!key || !fs.existsSync(authDir)) return;

  for (const name of fs.readdirSync(authDir)) {
    if (!isAuthPlaintextFile(name)) continue;
    const plainPath = path.join(authDir, name);
    if (!fs.statSync(plainPath).isFile()) continue;
    const plain = fs.readFileSync(plainPath);
    const encPath = plainPath + ENC_SUFFIX;
    fs.writeFileSync(encPath, encryptPlaintext(key, plain), { mode: 0o600 });
    fs.rmSync(plainPath, { force: true });
  }
}

/** Register graceful seal on worker shutdown (Baileys-only). */
export function registerAuthDirSealOnExit(authDir: string): void {
  if (!isWhatsAppAuthEncryptionEnabled()) return;
  const seal = () => {
    try {
      sealAuthDirEncrypted(authDir);
    } catch {
      /* best effort — never log file contents */
    }
  };
  process.once("SIGINT", seal);
  process.once("SIGTERM", seal);
  process.once("beforeExit", seal);
}
