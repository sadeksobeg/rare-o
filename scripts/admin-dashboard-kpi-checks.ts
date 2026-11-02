/**
 * Phase 4 ADM-01 — every dashboard awaiting-admin KPI must equal the
 * count of records that would appear on the matching filtered list.
 *
 *   npx tsx scripts/admin-dashboard-kpi-checks.ts
 */
process.loadEnvFile?.(".env");

import { getAdminHomeData } from "../lib/admin/dashboard";
import { prisma } from "../lib/db/prisma";
import {
  uiVisibleDealWhere,
  uiVisibleRetailRequestWhere,
  uiVisibleWholesaleWhere,
} from "../lib/admin/ui-hidden";
import {
  dealNextActor,
  retailNextActor,
  statusesAwaitingAdmin,
  wholesaleNextActor,
} from "../lib/ui/status";
import { countActiveBrokerage } from "../lib/brokerage/service";

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

async function countRetailWaiting() {
  const statuses = statusesAwaitingAdmin("retail");
  const rows = await prisma.retailRequest.findMany({
    where: {
      AND: [uiVisibleRetailRequestWhere(), { status: { in: statuses } }],
    },
    select: { status: true },
  });
  return rows.filter((r) => retailNextActor(r.status) === "admin").length;
}

async function countDealsWaiting() {
  const staticStatuses = statusesAwaitingAdmin("deal").filter(
    (s) => s !== "negotiating"
  );
  const rows = await prisma.dealProposal.findMany({
    where: {
      AND: [
        uiVisibleDealWhere(),
        { status: { in: [...staticStatuses, "negotiating"] } },
      ],
    },
    select: {
      status: true,
      entries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { actorRole: true },
      },
    },
  });
  return rows.filter((d) => {
    const last = d.entries[0]?.actorRole;
    const lastRole =
      last === "admin" || last === "trader" ? last : null;
    return dealNextActor(d.status, lastRole) === "admin";
  }).length;
}

async function countWholesaleWaiting() {
  const statuses = statusesAwaitingAdmin("wholesale");
  const rows = await prisma.wholesaleRequest.findMany({
    where: {
      AND: [uiVisibleWholesaleWhere(), { status: { in: statuses } }],
    },
    select: { status: true },
  });
  return rows.filter((r) => wholesaleNextActor(r.status) === "admin").length;
}

async function main() {
  const data = await getAdminHomeData();
  const [retail, deals, wholesale, brokerage] = await Promise.all([
    countRetailWaiting(),
    countDealsWaiting(),
    countWholesaleWaiting(),
    countActiveBrokerage(),
  ]);

  assert(
    data.kpis.retailAwaitingAdmin === retail,
    `retail KPI ${data.kpis.retailAwaitingAdmin} === list ${retail}`
  );
  assert(
    data.kpis.dealsAwaitingAdmin === deals,
    `deals KPI ${data.kpis.dealsAwaitingAdmin} === list ${deals}`
  );
  assert(
    data.kpis.wholesaleAwaitingAdmin === wholesale,
    `wholesale KPI ${data.kpis.wholesaleAwaitingAdmin} === list ${wholesale}`
  );
  assert(
    data.kpis.activeBrokerage === brokerage,
    `brokerage KPI ${data.kpis.activeBrokerage} === active ${brokerage}`
  );
  assert(
    data.requestsTrend.points.length === 14,
    `requests trend has 14 day points (${data.requestsTrend.points.length})`
  );
  assert(
    data.requestsTrend.total ===
      data.requestsTrend.points.reduce((a, b) => a + b, 0),
    "requests trend total equals sum of points"
  );

  console.log(`\nADM-01 KPI checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
