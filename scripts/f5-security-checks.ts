/**
 * Closure F5 — security smoke (IDOR, XSS persistence, login lockout, SVG upload).
 * Run: npx tsx scripts/f5-security-checks.ts
 * Optional: BASE or PLAYWRIGHT_BASE_URL for HTML escape check on deal thread.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { attachProductImage } from "../lib/catalog/images";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "../lib/auth/rate-limit";
import {
  addNegotiationEntry,
  createDealProposal,
  getDealForTrader,
} from "../lib/deals/service";
import { adminLoginAction } from "../app/actions";

const prisma = new PrismaClient();

const XSS_PAYLOAD = '<script>alert("f5-xss")</script>';

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

async function main() {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    process.env.AUTH_SECRET = "f5-security-checks-secret";
  }

  const hash = await bcrypt.hash("F5Security1!", 12);
  const traderA = await prisma.traderAccount.upsert({
    where: { email: "f5-trader-a@rareoud.local" },
    update: { status: "active", passwordHash: hash },
    create: {
      email: "f5-trader-a@rareoud.local",
      passwordHash: hash,
      displayName: "F5 Trader A",
      status: "active",
    },
  });
  const traderB = await prisma.traderAccount.upsert({
    where: { email: "f5-trader-b@rareoud.local" },
    update: { status: "active", passwordHash: hash },
    create: {
      email: "f5-trader-b@rareoud.local",
      passwordHash: hash,
      displayName: "F5 Trader B",
      status: "active",
    },
  });

  const deal = await createDealProposal({
    traderId: traderA.id,
    dealKind: "non_catalog",
    title: "F5 security deal",
    proposedPrice: 100,
    currency: "USD",
    quantity: 1,
    message: "seed",
  });

  let idor = false;
  try {
    await getDealForTrader(deal.id, traderB.id);
  } catch {
    idor = true;
  }
  assert(idor, "IDOR: trader B cannot read trader A deal");

  await addNegotiationEntry({
    dealId: deal.id,
    action: "continue",
    actorRole: "trader",
    actorTraderId: traderA.id,
    message: XSS_PAYLOAD,
  });
  const entry = await prisma.negotiationEntry.findFirst({
    where: { dealId: deal.id, message: XSS_PAYLOAD },
  });
  assert(!!entry, "XSS payload stored in negotiation message (persistence)");

  const base = (
    process.env.BASE ||
    process.env.PLAYWRIGHT_BASE_URL ||
    ""
  ).replace(/\/$/, "");
  if (base) {
    try {
      const res = await fetch(`${base}/trader/deals/${deal.id}`, {
        redirect: "manual",
      });
      const html = await res.text();
      const rawScript = /<script[^>]*>alert\s*\(\s*["']f5-xss["']\s*\)/i.test(
        html
      );
      assert(
        !rawScript,
        "XSS: deal page HTML has no executable script injection"
      );
      const escaped =
        html.includes("&lt;script") ||
        html.includes("\\u003cscript") ||
        !html.includes(XSS_PAYLOAD);
      assert(escaped, "XSS: payload escaped or absent in HTML response");
    } catch (e) {
      console.log(
        `SKIP: XSS HTML check — server unreachable at ${base} (${
          e instanceof Error ? e.message : e
        })`
      );
    }
  } else {
    console.log(
      "SKIP: BASE not set — XSS HTML escape check (DB persistence proven above)"
    );
  }

  const lockEmail = "f5-lock-admin@rareoud.local";
  clearLoginFailures("admin", lockEmail);
  for (let i = 0; i < 5; i++) {
    recordLoginFailure("admin", lockEmail);
  }
  assert(
    isLoginLocked("admin", lockEmail).locked,
    "login lockout after N failures (rate-limit module)"
  );

  await prisma.adminUser.upsert({
    where: { email: lockEmail },
    update: {},
    create: {
      email: lockEmail,
      passwordHash: await bcrypt.hash("WrongPassOnly1!", 12),
      name: "F5 Lock Admin",
    },
  });
  clearLoginFailures("admin", lockEmail);
  for (let i = 0; i < 5; i++) {
    const fd = new FormData();
    fd.set("email", lockEmail);
    fd.set("password", "DefinitelyWrongPass99!");
    await adminLoginAction(null, fd);
  }
  const lockedFd = new FormData();
  lockedFd.set("email", lockEmail);
  lockedFd.set("password", "DefinitelyWrongPass99!");
  const locked = await adminLoginAction(null, lockedFd);
  assert(
    !locked.ok && locked.error === "LOGIN_LOCKED",
    "adminLoginAction returns LOGIN_LOCKED after failures"
  );
  clearLoginFailures("admin", lockEmail);

  const product = await prisma.product.findFirst();
  assert(!!product, "product exists for SVG upload test");
  const svgBody =
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
  const svgFile = new File([svgBody], "evil.svg", { type: "image/svg+xml" });
  const upload = await attachProductImage({
    productId: product!.id,
    file: svgFile,
  });
  assert(!upload.ok && upload.error === "TYPE", "SVG upload rejected (TYPE)");

  console.log(`\nf5-security-checks: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
