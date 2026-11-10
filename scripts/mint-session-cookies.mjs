/**
 * Mint admin/trader session JWTs for CDP screenshot scripts (no form login).
 * Prints JSON: { admin, trader, adminCookie, traderCookie }
 */
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(ROOT, ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  if (!process.env[m[1]]) {
    process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const secret = process.env.AUTH_SECRET;
if (!secret || secret.length < 16) {
  console.error("AUTH_SECRET missing");
  process.exit(1);
}
const key = new TextEncoder().encode(secret);
const prisma = new PrismaClient();

async function mint(role, sub, claims) {
  return new SignJWT({ ...claims, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key);
}

const admin = await prisma.adminUser.findFirst();
const trader =
  (await prisma.traderAccount.findFirst({
    where: {
      status: "active",
      NOT: {
        OR: [
          { email: { startsWith: "reg-trader-" } },
          { displayName: { startsWith: "Reg Trader" } },
        ],
      },
    },
    orderBy: { createdAt: "asc" },
  })) ||
  (await prisma.traderAccount.findFirst({ where: { status: "active" } }));
if (!admin || !trader) {
  console.error("Need admin + active trader in DB", { admin: !!admin, trader: !!trader });
  process.exit(1);
}

const adminToken = await mint("admin", admin.id, {
  email: admin.email,
  name: admin.name,
});
const traderToken = await mint("trader", trader.id, {
  email: trader.email,
  displayName: trader.displayName,
});

const waitingDeal =
  (await prisma.dealProposal.findFirst({
    where: {
      traderId: trader.id,
      status: "negotiating",
      OR: [
        { reference: "DL-DEMO-WAIT" },
        { reference: "DL-SEED-WAIT" },
      ],
    },
    select: { id: true, reference: true },
  })) ||
  (await prisma.dealProposal.findFirst({
    where: { traderId: trader.id, status: "negotiating" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, reference: true },
  }));

const wholesaleSample = await prisma.wholesaleRequest.findFirst({
  where: { traderId: trader.id },
  orderBy: { updatedAt: "desc" },
  select: { id: true, reference: true },
});

console.log(
  JSON.stringify({
    adminCookie: "ro_admin_session",
    traderCookie: "ro_trader_session",
    admin: adminToken,
    trader: traderToken,
    adminEmail: admin.email,
    traderEmail: trader.email,
    waitingDealId: waitingDeal?.id ?? null,
    waitingDealRef: waitingDeal?.reference ?? null,
    wholesaleId: wholesaleSample?.id ?? null,
  })
);
await prisma.$disconnect();
