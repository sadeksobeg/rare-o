import {
  generateTotpSecret,
  verifyTotp,
  encryptTotpSecret,
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  consumeRecoveryCode,
} from "../lib/auth/totp";
import { createHmac } from "node:crypto";

function currentTotp(secretB32: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = secretB32.replace(/=+$/, "").toUpperCase();
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
  const key = Buffer.from(out);
  const counter = Buffer.alloc(8);
  const now = Math.floor(Date.now() / 1000 / 30);
  counter.writeUInt32BE(0, 0);
  counter.writeUInt32BE(now, 4);
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

async function main() {
  let passed = 0;
  let failed = 0;
  function assert(cond: unknown, msg: string) {
    if (cond) {
      console.log(`PASS: ${msg}`);
      passed += 1;
    } else {
      console.error(`FAIL: ${msg}`);
      failed += 1;
    }
  }

  const { secret } = generateTotpSecret();
  assert(secret.length >= 16, "totp secret generated");

  const token = currentTotp(secret);
  assert(verifyTotp(secret, token), "verify accepts current window token");
  assert(
    !verifyTotp(secret, "000000") || token === "000000",
    "rejects wrong token (or rare collision)"
  );

  const enc = encryptTotpSecret(secret);
  assert(enc !== secret, "secret encrypted");
  assert(decryptTotpSecret(enc) === secret, "secret round-trips");

  const codes = generateRecoveryCodes(4);
  assert(codes.length === 4, "recovery codes count");
  const hashed = await hashRecoveryCodes(codes);
  const used = await consumeRecoveryCode(hashed, codes[0]);
  assert(used.ok, "recovery code consumes");
  const reused = await consumeRecoveryCode(used.remainingJson, codes[0]);
  assert(!reused.ok, "recovery code cannot reuse");

  console.log(`\nf3-2fa-checks: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main();
