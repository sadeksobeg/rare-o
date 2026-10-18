import { prisma } from "@/lib/db/prisma";
import { isOpenDealStatus, type DealStatus } from "@/lib/deals/constants";

/** Statuses that occupy a catalog product commercially (for warnings only). */
const CONFLICT_STATUSES: DealStatus[] = [
  "proposed",
  "negotiating",
  "accepted",
];

export type CatalogDealConflictHit = {
  id: string;
  reference: string;
  status: string;
  traderId: string;
  traderDisplayName: string;
};

/**
 * Look up other traders' active catalog deals on the same product.
 * Owner decision: NEVER block traders — admin sees a WARNING on accept only.
 */
export async function findCatalogDealConflicts(input: {
  productId: string;
  excludeDealId?: string;
  /** Prefer hits owned by a different trader than this id. */
  otherThanTraderId?: string;
}): Promise<CatalogDealConflictHit[]> {
  const blockers = await prisma.dealProposal.findMany({
    where: {
      productId: input.productId,
      dealKind: "catalog",
      status: { in: CONFLICT_STATUSES },
      ...(input.excludeDealId ? { id: { not: input.excludeDealId } } : {}),
    },
    select: {
      id: true,
      reference: true,
      status: true,
      traderId: true,
      trader: { select: { displayName: true } },
    },
    take: 10,
  });

  return blockers
    .filter((b) =>
      input.otherThanTraderId ? b.traderId !== input.otherThanTraderId : true
    )
    .map((b) => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      traderId: b.traderId,
      traderDisplayName: b.trader.displayName,
    }));
}

/** @deprecated Blocking removed — use findCatalogDealConflicts + admin warning. */
export async function assertNoCatalogDealConflict(_input?: {
  productId: string;
  excludeDealId?: string;
  requireOtherTraderId?: string;
}): Promise<void> {
  void _input;
  // No-op: traders are never rejected for product conflict (owner decision).
}

export function isConflictStatus(status: string): boolean {
  return (
    CONFLICT_STATUSES.includes(status as DealStatus) ||
    isOpenDealStatus(status as DealStatus)
  );
}
