import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createCipheriv, createDecipheriv } from "node:crypto";
import bcrypt from "bcryptjs";

const PERIOD = 30;
const DIGITS = 6;

function base32Encode(buf: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of cleaned) {
    const idx = alphabet.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(account = "admin"): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = base32Encode(randomBytes(20));
  const label = encodeURIComponent(`RARE OUD:${account}`);
  const issuer = encodeURIComponent("RARE OUD");
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=${DIGITS}&period=${PERIOD}&algorithm=SHA1`;
  return { secret, otpauthUrl };
}

export function verifyTotp(secret: string, token: string, window = 2): boolean {
  const clean = token.replace(/\s/g, "").replace(/[^\d]/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const key = base32Decode(secret);
  if (key.length < 10) return false;
  const now = Math.floor(Date.now() / 1000 / PERIOD);
  for (let w = -window; w <= window; w += 1) {
    const counter = Buffer.alloc(8);
    counter.writeUInt32BE(0, 0);
    counter.writeUInt32BE(now + w, 4);
    const hmac = createHmac("sha1", key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const str = String(code % 10 ** DIGITS).padStart(DIGITS, "0");
    const a = Buffer.from(str);
    const b = Buffer.from(clean);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

function encKey(): Buffer {
  const secret = process.env.AUTH_SECRET || "dev-only-auth-secret!!";
  return createHmac("sha256", "rare-oud-totp").update(secret).digest();
}

export function encryptTotpSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptTotpSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export async function hashRecoveryCodes(codes: string[]): Promise<string> {
  const hashes = [];
  for (const c of codes) {
    hashes.push(await bcrypt.hash(c, 10));
  }
  return JSON.stringify(hashes);
}

export function generateRecoveryCodes(n = 8): string[] {
  return Array.from({ length: n }, () =>
    randomBytes(5).toString("hex").toUpperCase()
  );
}

export async function consumeRecoveryCode(
  hashesJson: string,
  code: string
): Promise<{ ok: boolean; remainingJson: string }> {
  const hashes: string[] = JSON.parse(hashesJson || "[]");
  for (let i = 0; i < hashes.length; i += 1) {
    if (await bcrypt.compare(code.trim().toUpperCase(), hashes[i])) {
      const next = [...hashes];
      next.splice(i, 1);
      return { ok: true, remainingJson: JSON.stringify(next) };
    }
  }
  return { ok: false, remainingJson: hashesJson };
}
