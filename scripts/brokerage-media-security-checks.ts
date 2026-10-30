/**
 * Phase 1 — private brokerage media (AUDIT C-1).
 * Real HTTP checks against a running server: unauthenticated -> 404,
 * wrong trader -> 404, owning trader -> 200, admin -> 200, bad filename
 * (path-traversal attempt) -> 404.
 *
 *   npx tsx scripts/brokerage-media-security-checks.ts
 *   (server must be running; BASE defaults to http://localhost:3000)
 */
process.loadEnvFile?.(".env");

import { rm } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db/prisma";
import { createAdminSessionToken } from "../lib/auth/admin-session";
import { createTraderSessionToken } from "../lib/auth/trader-session";
import { createBrokerageRequest, setBrokerageRequestPhotos } from "../lib/brokerage/service";
import { saveBrokeragePhotos, uploadsRoot } from "../lib/brokerage/media";

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

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function main() {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || authSecret.length < 16) {
    throw new Error(
      "AUTH_SECRET not loaded from .env — this script needs the real secret the running server uses."
    );
  }

  const hash = await bcrypt.hash("MediaSecurity1!", 12);
  const traderA = await prisma.traderAccount.upsert({
    where: { email: "media-sec-trader-a@rareoud.local" },
    update: { status: "active", passwordHash: hash },
    create: {
      email: "media-sec-trader-a@rareoud.local",
      passwordHash: hash,
      displayName: "Media Sec Trader A",
      status: "active",
    },
  });
  const traderB = await prisma.traderAccount.upsert({
    where: { email: "media-sec-trader-b@rareoud.local" },
    update: { status: "active", passwordHash: hash },
    create: {
      email: "media-sec-trader-b@rareoud.local",
      passwordHash: hash,
      displayName: "Media Sec Trader B",
      status: "active",
    },
  });
  const admin = await prisma.adminUser.findFirst();
  if (!admin) throw new Error("No admin user in DB — run npm run db:seed");

  const request = await createBrokerageRequest({
    traderId: traderA.id,
    descriptionAr: "فحص أمان الوسائط — E2E",
    descriptionEn: "Media security check — E2E",
  });

  const file = new File([PNG_1X1], "test.png", { type: "image/png" });
  const saved = await saveBrokeragePhotos(request.id, [file], 0);
  assert(saved.ok, "test photo saved via saveBrokeragePhotos");
  if (!saved.ok) {
    await prisma.brokerageRequest.delete({ where: { id: request.id } });
    return;
  }
  await setBrokerageRequestPhotos(request.id, saved.paths);
  const mediaPath = saved.paths[0]!;
  assert(
    mediaPath.startsWith("/api/media/brokerage/"),
    "saved path uses the authenticated media route prefix"
  );
  const mediaUrl = `${BASE}${mediaPath}`;

  const adminToken = await createAdminSessionToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    mustChangePassword: false,
    pwv: admin.passwordChangedAt?.getTime() ?? 0,
  });
  const traderAToken = await createTraderSessionToken({
    sub: traderA.id,
    email: traderA.email,
    displayName: traderA.displayName,
    mustChangePassword: false,
    pwv: 0,
  });
  const traderBToken = await createTraderSessionToken({
    sub: traderB.id,
    email: traderB.email,
    displayName: traderB.displayName,
    mustChangePassword: false,
    pwv: 0,
  });

  try {
    const unauth = await fetch(mediaUrl);
    assert(unauth.status === 404, `unauthenticated -> 404 (got ${unauth.status})`);

    const wrongTrader = await fetch(mediaUrl, {
      headers: { Cookie: `ro_trader_session=${traderBToken}` },
    });
    assert(
      wrongTrader.status === 404,
      `trader B (not owner) -> 404 (got ${wrongTrader.status})`
    );

    const owner = await fetch(mediaUrl, {
      headers: { Cookie: `ro_trader_session=${traderAToken}` },
    });
    assert(owner.status === 200, `owning trader -> 200 (got ${owner.status})`);
    if (owner.status === 200) {
      assert(
        owner.headers.get("content-type") === "image/webp",
        "owner response has image/webp content-type"
      );
      assert(
        owner.headers.get("cache-control")?.includes("private") ?? false,
        "owner response has private Cache-Control"
      );
    }

    const asAdmin = await fetch(mediaUrl, {
      headers: { Cookie: `ro_admin_session=${adminToken}` },
    });
    assert(asAdmin.status === 200, `admin -> 200 (got ${asAdmin.status})`);

    const traversalUrl = `${BASE}/api/media/brokerage/${request.id}/not-a-real-filename`;
    const traversal = await fetch(traversalUrl, {
      headers: { Cookie: `ro_admin_session=${adminToken}` },
    });
    assert(
      traversal.status === 404,
      `non-matching filename pattern -> 404 (got ${traversal.status})`
    );
  } catch (e) {
    failed++;
    console.error(
      `FAIL: HTTP checks threw — is the server running at ${BASE}? (${
        e instanceof Error ? e.message : e
      })`
    );
  }

  await prisma.brokerageRequest.delete({ where: { id: request.id } });
  await prisma.traderAccount.deleteMany({
    where: { id: { in: [traderA.id, traderB.id] } },
  });
  await rm(path.join(uploadsRoot(), request.id), {
    recursive: true,
    force: true,
  });

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
