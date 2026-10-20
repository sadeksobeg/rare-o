/**
 * Extra lib unit checks for F5 coverage (lib/auth, lib/db, lib/deals).
 */
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";

import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "../lib/auth/rate-limit";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  hashPassword,
  verifyPassword,
  ADMIN_SESSION_ROLE,
} from "../lib/auth/admin-session";
import {
  createTraderSessionToken,
  verifyTraderSessionToken,
} from "../lib/auth/trader-session";
import {
  checkRetailRequestRateLimit,
  consumeRateLimit,
} from "../lib/auth/public-rate-limit";
import {
  isConflictStatus,
  assertNoCatalogDealConflict,
} from "../lib/deals/conflict";
import {
  isDealStatus,
  isOpenDealStatus,
  nextDealStatusForAction,
} from "../lib/deals/constants";
import { containsCI } from "../lib/db/search";
import { prisma } from "../lib/db/prisma";
import {
  generateTotpSecret,
  verifyTotp,
  generateRecoveryCodes,
} from "../lib/auth/totp";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
    return;
  }
  passed += 1;
  console.log(`PASS: ${msg}`);
}

export async function runF5LibUnit(): Promise<{ passed: number; failed: number }> {
  passed = 0;
  failed = 0;

  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    process.env.AUTH_SECRET = "f5-lib-unit-auth-secret";
  }

  clearLoginFailures("admin", "f5-lock@example.com");
  for (let i = 0; i < 5; i++) {
    recordLoginFailure("admin", "f5-lock@example.com");
  }
  const locked = isLoginLocked("admin", "f5-lock@example.com");
  assert(locked.locked === true, "login lockout after max failures");
  clearLoginFailures("admin", "f5-lock@example.com");

  const hp = await hashPassword("TestPass123!");
  assert(await verifyPassword("TestPass123!", hp), "bcrypt verifyPassword");

  const adminToken = await createAdminSessionToken({
    sub: "admin-1",
    email: "a@example.com",
    name: "Admin",
  });
  const adminSession = await verifyAdminSessionToken(adminToken);
  assert(adminSession?.sub === "admin-1", "admin JWT round-trip");

  const traderToken = await createTraderSessionToken({
    sub: "trader-1",
    email: "t@example.com",
    displayName: "Trader",
  });
  assert(
    (await verifyAdminSessionToken(traderToken)) === null,
    "trader token rejected by admin verifier"
  );
  assert(
    (await verifyTraderSessionToken(adminToken)) === null,
    "admin token rejected by trader verifier"
  );

  const wrongRole = await new SignJWT({
    email: "x@example.com",
    name: "X",
    role: "not-admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("x")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
  assert(
    (await verifyAdminSessionToken(wrongRole)) === null,
    "non-admin role JWT rejected"
  );
  assert(ADMIN_SESSION_ROLE === "admin", "admin role constant");

  const rl = consumeRateLimit({
    scope: "f5-lib",
    identity: "test",
    max: 2,
    windowMs: 60_000,
  });
  assert(rl.allowed, "public rate limit allows first");
  const retailRl = checkRetailRequestRateLimit({
    clientKey: "f5-lib-test",
    phone: "+963900000099",
  });
  assert(typeof retailRl.allowed === "boolean", "retail rate limit callable");

  assert(isConflictStatus("negotiating"), "deal conflict status");
  assert(!isConflictStatus("closed"), "closed not conflict");
  await assertNoCatalogDealConflict({
    productId: "noop",
    excludeDealId: "x",
  });

  assert(isDealStatus("negotiating"), "isDealStatus");
  assert(isOpenDealStatus("negotiating"), "open deal status");
  assert(
    nextDealStatusForAction("negotiating", "accept") === "accepted",
    "deal status transition accept"
  );

  const ci = containsCI("Oud");
  assert(ci.contains === "Oud", "containsCI filter shape");

  await prisma.$queryRaw`SELECT 1`;
  assert(true, "lib/db/prisma connects");

  const totp = generateTotpSecret();
  assert(totp.secret.length > 10, "generateTotpSecret");
  assert(generateRecoveryCodes(2).length === 2, "generateRecoveryCodes");
  assert(
    verifyTotp(totp.secret, "000000") === false,
    "verifyTotp rejects garbage token"
  );

  console.log(`f5-lib-unit: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

runF5LibUnit().then(({ failed: f }) => process.exit(f > 0 ? 1 : 0));
