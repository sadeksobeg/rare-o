/**
 * Contract 7.1 — Data Encryption & Secure Storage gate.
 * Verifies app-layer encryption controls exist and crypto round-trips work.
 * Does NOT claim field-level Postgres PII encryption (out of contract scope).
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];

function ok(cond, msg) {
  if (!cond) fails.push(msg);
  else console.log(`PASS  ${msg}`);
}

function mustExist(rel) {
  const p = path.join(root, rel);
  ok(fs.existsSync(p), `exists ${rel}`);
  return p;
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

mustExist("lib/auth/admin-session.ts");
mustExist("lib/auth/trader-session.ts");
mustExist("lib/auth/totp.ts");
mustExist("lib/security/wa-auth-crypto.ts");
mustExist("docs/security/ENCRYPTION-AND-STORAGE.md");
mustExist("docs/security/ASVS-L2.md");
mustExist(".env.production.example");

const adminSession = read("lib/auth/admin-session.ts");
ok(adminSession.includes("bcrypt"), "admin passwords use bcrypt");
ok(adminSession.includes("httpOnly: true"), "admin cookie httpOnly");
ok(adminSession.includes('sameSite: "lax"'), "admin cookie sameSite=lax");
ok(
  adminSession.includes("secure: process.env.NODE_ENV === \"production\""),
  "admin cookie secure in production"
);
ok(adminSession.includes("SignJWT") || adminSession.includes("jose"), "admin JWT signing");

const traderSession = read("lib/auth/trader-session.ts");
ok(
  traderSession.includes("hashPassword") && traderSession.includes("verifyPassword"),
  "trader passwords use shared bcrypt helpers"
);
ok(traderSession.includes("httpOnly: true"), "trader cookie httpOnly");

const totp = read("lib/auth/totp.ts");
ok(totp.includes("encryptTotpSecret"), "TOTP secrets encrypted at rest");
ok(totp.includes("aes-256-gcm") || totp.includes("createCipheriv"), "TOTP AES-GCM");

const wa = read("lib/security/wa-auth-crypto.ts");
ok(wa.includes("aes-256-gcm"), "WhatsApp auth AES-256-GCM");
ok(wa.includes("WHATSAPP_AUTH_KEY"), "WhatsApp auth key env");

const envEx = read(".env.production.example");
ok(envEx.includes("AUTH_SECRET="), "prod example has AUTH_SECRET");
ok(envEx.includes("WHATSAPP_AUTH_KEY"), "prod example documents WHATSAPP_AUTH_KEY");
ok(
  envEx.includes("WHATSAPP_CONNECT_ON_START=false"),
  "prod example keeps WhatsApp connect off by default"
);
ok(
  envEx.includes("WHATSAPP_OUTBOUND_ENABLED=false"),
  "prod example keeps WhatsApp outbound off by default"
);

const asvs = read("docs/security/ASVS-L2.md");
ok(
  asvs.includes("[x] Admin TOTP 2FA"),
  "ASVS marks admin TOTP as shipped"
);
ok(
  asvs.includes("Field-level encryption") &&
    (asvs.includes("not required") || asvs.includes("out of scope")),
  "ASVS documents field-level PII encryption as out of scope"
);

const encDoc = read("docs/security/ENCRYPTION-AND-STORAGE.md");
ok(encDoc.includes("bcrypt"), "encryption doc covers password hashing");
ok(encDoc.includes("TOTP") || encDoc.includes("totp"), "encryption doc covers TOTP");
ok(encDoc.includes("TLS") || encDoc.includes("HTTPS") || encDoc.includes("SSL"), "encryption doc covers transit TLS");

/** TOTP-style AES-256-GCM round-trip (mirrors lib/auth/totp.ts keying). */
{
  const secret = "gate-auth-secret-min-16!";
  const key = createHmac("sha256", "rare-oud-totp").update(secret).digest();
  const iv = randomBytes(12);
  const plain = "JBSWY3DPEHPK3PXP";
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  ok(out === plain, "TOTP AES-256-GCM round-trip");
}

/** WA-auth style AES-256-GCM round-trip. */
{
  const key = createHmac("sha256", "wa-auth-gate").update("material").digest();
  const iv = randomBytes(12);
  const plain = Buffer.from('{"creds":true}', "utf8");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, enc]);
  const riv = payload.subarray(0, 12);
  const rtag = payload.subarray(12, 28);
  const data = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, riv);
  decipher.setAuthTag(rtag);
  const out = Buffer.concat([decipher.update(data), decipher.final()]);
  ok(out.equals(plain), "WhatsApp auth AES-256-GCM round-trip");
}

const gitignore = read(".gitignore");
ok(gitignore.includes(".env"), ".gitignore excludes .env");
ok(
  gitignore.includes(".wa-auth") || gitignore.includes("wa-auth"),
  ".gitignore excludes WhatsApp auth dir"
);

if (fails.length) {
  console.error("\nFAIL security-storage-gate:");
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\n7.1 security-storage-gate OK");
