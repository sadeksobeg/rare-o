/**
 * Remove regression / demo fixture rows (same markers as ui-hidden).
 * Default: dry-run. Pass --apply to delete.
 *
 * Usage:
 *   npm run purge:demo
 *   npm run purge:demo -- --apply
 *
 * Does NOT delete published storefront seed products (e.g. demo-string-instrument).
 * Never touches data when RO_SHOW_UI_FIXTURES=1 unless --apply is explicit.
 */
import { parseArgs } from "node:util";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HIDDEN_TRADER_EMAILS = [
  "reg-trader-a@rareoud.local",
  "reg-trader-b@rareoud.local",
  "trader@rareoud.local",
  "sec-trader-a@rareoud.local",
  "sec-trader-b@rareoud.local",
  "demo-ar@rareoud.local",
];

const HIDDEN_CUSTOMER_NAMES = [
  "Regression Customer",
  "عميل تجريبي",
  "اختبار",
];

const HIDDEN_CUSTOMER_PHONES = ["+10000000001", "+963911000001"];

const REF_PREFIXES = [
  "DL-SEED-",
  "DL-DEMO-",
  "WS-SEED-",
  "WS-DEMO-",
  "REG-",
  "DP-PD-",
];

function refOr(prefixes: string[]) {
  return prefixes.map((p) => ({ reference: { startsWith: p } }));
}

async function countPlan() {
  const traders = await prisma.traderAccount.count({
    where: {
      OR: [
        { email: { in: HIDDEN_TRADER_EMAILS } },
        { displayName: { in: ["Reg Trader A", "Reg Trader B", "Demo Trader", "Sec Trader A", "Sec Trader B"] } },
        { adminNotes: { contains: "[DEMO]" } },
      ],
    },
  });

  const deals = await prisma.dealProposal.count({
    where: {
      OR: [
        ...refOr(REF_PREFIXES),
        { title: { in: ["Regression catalog deal", "Non-catalog opportunity"] } },
      ],
    },
  });

  const wholesale = await prisma.wholesaleRequest.count({
    where: { OR: refOr(["WS-SEED-", "WS-DEMO-", "REG-"]) },
  });

  const customers = await prisma.customer.count({
    where: {
      OR: [
        { name: { in: HIDDEN_CUSTOMER_NAMES } },
        { phone: { in: HIDDEN_CUSTOMER_PHONES } },
        { notes: { contains: "[DEMO]" } },
      ],
    },
  });

  const retailRequests = await prisma.retailRequest.count({
    where: {
      OR: [
        { customerName: { in: HIDDEN_CUSTOMER_NAMES } },
        { customerPhone: { in: HIDDEN_CUSTOMER_PHONES } },
      ],
    },
  });

  return { traders, deals, wholesale, customers, retailRequests };
}

async function applyPurge() {
  await prisma.dealProposal.deleteMany({
    where: {
      OR: [
        ...refOr(REF_PREFIXES),
        { title: { in: ["Regression catalog deal", "Non-catalog opportunity"] } },
      ],
    },
  });

  await prisma.wholesaleRequest.deleteMany({
    where: { OR: refOr(["WS-SEED-", "WS-DEMO-", "REG-"]) },
  });

  await prisma.retailRequest.deleteMany({
    where: {
      OR: [
        { customerName: { in: HIDDEN_CUSTOMER_NAMES } },
        { customerPhone: { in: HIDDEN_CUSTOMER_PHONES } },
      ],
    },
  });

  await prisma.customer.deleteMany({
    where: {
      OR: [
        { name: { in: HIDDEN_CUSTOMER_NAMES } },
        { phone: { in: HIDDEN_CUSTOMER_PHONES } },
        { notes: { contains: "[DEMO]" } },
      ],
    },
  });

  await prisma.traderAccount.deleteMany({
    where: {
      OR: [
        { email: { in: HIDDEN_TRADER_EMAILS } },
        { displayName: { in: ["Reg Trader A", "Reg Trader B", "Demo Trader", "Sec Trader A", "Sec Trader B"] } },
        { adminNotes: { contains: "[DEMO]" } },
      ],
    },
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean", default: false },
    },
  });

  const dryRun = !values.apply;

  if (process.env.RO_SHOW_UI_FIXTURES === "1" && values.apply) {
    console.warn(
      "warning: RO_SHOW_UI_FIXTURES=1 — purge still runs with --apply (fixtures hidden in UI only)"
    );
  }

  const plan = await countPlan();
  console.log("purge-demo plan (matching ui-hidden / seed-demo markers):");
  console.log(JSON.stringify(plan, null, 2));

  if (dryRun) {
    console.log("\ndry-run — no rows deleted. Re-run with --apply to purge.");
    return;
  }

  await applyPurge();
  const after = await countPlan();
  console.log("\npurge complete. Remaining matching rows:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
