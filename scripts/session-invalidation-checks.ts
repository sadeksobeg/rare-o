/**
 * Phase 1 — AUDIT-PHASE-1.md M-1: a session invalidated by a password change
 * on another device (pwv mismatch) must get a clean sign-out on a page
 * request, not a dead-end generic error.
 *
 * Real HTTP checks against a running server: a stale-pwv cookie hitting any
 * protected admin/trader page redirects (through /admin|/trader/sign-out-stale)
 * to the login page with ?notice=session_invalidated — never 500s, never
 * lands on error.tsx.
 *
 *   npx tsx scripts/session-invalidation-checks.ts
 *   (server must be running; BASE defaults to http://localhost:3000)
 */
process.loadEnvFile?.(".env");

import bcrypt from "bcryptjs";
import { prisma } from "../lib/db/prisma";
import { createAdminSessionToken } from "../lib/auth/admin-session";
import { createTraderSessionToken } from "../lib/auth/trader-session";

const BASE = process.env.BASE || "http://localhost:3000";

let passed = 0;
let failed = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${msg}`);
    return;
  }
  passed++;
  console.log(`PASS: ${msg}`);
}

async function checkRedirect(
  cookieName: string,
  token: string,
  protectedPath: string,
  loginPath: string
) {
  const res = await fetch(`${BASE}${protectedPath}`, {
    headers: { Cookie: `${cookieName}=${token}` },
    redirect: "manual",
  });
  // Next.js server-redirects from middleware/Server Components land here as
  // 307/308; "manual" stops fetch from following them so we can inspect the
  // chain's first hop directly.
  assert(
    res.status === 307 || res.status === 308,
    `${protectedPath} with a stale session -> redirect (got ${res.status})`
  );
  const location = res.headers.get("location") ?? "";
  // Either hop is acceptable: straight to the login page's notice, or via
  // the sign-out-stale route handler (which itself redirects to the notice).
  const first = location.includes("sign-out-stale") || location.includes(loginPath);
  assert(
    first,
    `${protectedPath} redirect target is sign-out-stale or ${loginPath} (got "${location}")`
  );

  if (location.includes("sign-out-stale")) {
    // Node's fetch has no cookie jar — a browser following this redirect
    // would resend the cookie automatically, so this test must do the same.
    const hop2 = await fetch(
      location.startsWith("http") ? location : `${BASE}${location}`,
      { headers: { Cookie: `${cookieName}=${token}` }, redirect: "manual" }
    );
    assert(
      hop2.status === 307 || hop2.status === 308,
      `sign-out-stale -> redirect to login (got ${hop2.status})`
    );
    const hop2Location = hop2.headers.get("location") ?? "";
    assert(
      hop2Location.includes(loginPath) &&
        hop2Location.includes("notice=session_invalidated"),
      `sign-out-stale redirects to ${loginPath}?notice=session_invalidated (got "${hop2Location}")`
    );
    const setCookie = hop2.headers.get("set-cookie") ?? "";
    assert(
      setCookie.includes(cookieName) &&
        (setCookie.toLowerCase().includes("expires=thu, 01 jan 1970") ||
          setCookie.includes("Max-Age=0")),
      "sign-out-stale clears the stale session cookie"
    );
  } else {
    assert(
      location.includes("notice=session_invalidated"),
      `direct redirect to ${loginPath} carries notice=session_invalidated (got "${location}")`
    );
  }
}

async function main() {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || authSecret.length < 16) {
    throw new Error(
      "AUTH_SECRET not loaded from .env — this script needs the real secret the running server uses."
    );
  }

  const hash = await bcrypt.hash("SessionInvalidation1!", 12);
  const trader = await prisma.traderAccount.upsert({
    where: { email: "session-inval-trader@rareoud.local" },
    update: { status: "active", passwordHash: hash, passwordChangedAt: new Date() },
    create: {
      email: "session-inval-trader@rareoud.local",
      passwordHash: hash,
      displayName: "Session Invalidation Trader",
      status: "active",
      passwordChangedAt: new Date(),
    },
  });
  const admin = await prisma.adminUser.findFirst();
  if (!admin) throw new Error("No admin user in DB — run npm run db:seed");
  const adminOriginalPwv = admin.passwordChangedAt?.getTime() ?? 0;

  try {
    // Bump the admin's passwordChangedAt so a token signed with the OLD pwv
    // (0, below) is stale relative to the DB — exactly the "changed on
    // another device" scenario, without touching the real admin's password.
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordChangedAt: new Date() },
    });

    const staleAdminToken = await createAdminSessionToken({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      mustChangePassword: false,
      pwv: 0, // stale: predates the update above
    });
    const staleTraderToken = await createTraderSessionToken({
      sub: trader.id,
      email: trader.email,
      displayName: trader.displayName,
      mustChangePassword: false,
      pwv: 0, // stale: predates the trader's own passwordChangedAt
    });

    await checkRedirect(
      "ro_admin_session",
      staleAdminToken,
      "/admin/traders",
      "/admin/login"
    );
    await checkRedirect(
      "ro_trader_session",
      staleTraderToken,
      "/trader/profile",
      "/trader/login"
    );

    // A fresh (non-stale) token for the same accounts must NOT be redirected
    // as invalidated — sanity check that the gate isn't just rejecting
    // everything.
    const freshTrader = await prisma.traderAccount.findUniqueOrThrow({
      where: { id: trader.id },
    });
    const freshToken = await createTraderSessionToken({
      sub: trader.id,
      email: trader.email,
      displayName: trader.displayName,
      mustChangePassword: false,
      pwv: freshTrader.passwordChangedAt?.getTime() ?? 0,
    });
    const freshRes = await fetch(`${BASE}/trader/profile`, {
      headers: { Cookie: `ro_trader_session=${freshToken}` },
      redirect: "manual",
    });
    assert(
      freshRes.status === 200,
      `a fresh (non-stale) session is NOT treated as invalidated (got ${freshRes.status})`
    );
  } finally {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordChangedAt: admin.passwordChangedAt },
    });
    await prisma.traderAccount.delete({ where: { id: trader.id } });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("FAIL", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
