import { uiVisibleDealWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { findCatalogDealConflicts } from "@/lib/deals/conflict";
import {
  DEAL_KINDS,
  isDealStatus,
  isOpenDealStatus,
  nextDealStatusForAction,
  type DealKind,
  type DealStatus,
  type NegotiationAction,
  type NegotiationActorRole,
} from "@/lib/deals/constants";
import { hashPassword } from "@/lib/auth/trader-session";
import { notifyTrader } from "@/lib/trader/notifications";

function buildDealReference(now = new Date()): string {
  const y = now.getUTCFullYear();
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `DP-${y}-${n}`;
}

export type CreateTraderInput = {
  email: string;
  password: string;
  displayName: string;
  companyName?: string;
  phone?: string;
  adminNotes?: string;
};

export async function createTraderAccount(input: CreateTraderInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.traderAccount.findUnique({ where: { email } });
  if (existing) throw new Error("TRADER_EMAIL_EXISTS");

  const passwordHash = await hashPassword(input.password);
  return prisma.traderAccount.create({
    data: {
      email,
      passwordHash,
      displayName: input.displayName.trim(),
      companyName: input.companyName?.trim() || "",
      phone: input.phone?.trim() || "",
      adminNotes: input.adminNotes?.trim() || "",
      status: "active",
    },
  });
}

export async function setTraderAccountStatus(
  traderId: string,
  status: "active" | "disabled"
) {
  return prisma.traderAccount.update({
    where: { id: traderId },
    data: { status },
  });
}

export type CreateDealInput = {
  /** Always from session — never from client body as source of truth */
  traderId: string;
  dealKind: DealKind;
  title: string;
  productId?: string | null;
  proposedPrice?: number | null;
  currency?: string | null;
  quantity?: number | null;
  conditionsNotes?: string;
  message?: string;
};

export async function createDealProposal(input: CreateDealInput) {
  if (!DEAL_KINDS.includes(input.dealKind)) {
    throw new Error("INVALID_DEAL_KIND");
  }

  let productId: string | null = null;
  if (input.dealKind === "catalog") {
    if (!input.productId) throw new Error("CATALOG_PRODUCT_REQUIRED");
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    // Reference only — does not transfer ownership or create catalog rows
    productId = product.id;
    // Owner decision: never block traders on product conflict (admin warning on accept).
  } else {
    if (input.productId) throw new Error("NON_CATALOG_MUST_NOT_REFERENCE_PRODUCT");
    productId = null;
  }

  const reference = buildDealReference();
  const status: DealStatus = "proposed";

  return prisma.dealProposal.create({
    data: {
      reference,
      traderId: input.traderId,
      dealKind: input.dealKind,
      title: input.title.trim(),
      productId,
      proposedPrice:
        input.proposedPrice === undefined || input.proposedPrice === null
          ? null
          : input.proposedPrice,
      currency: input.currency?.trim().toUpperCase() || null,
      quantity: input.quantity ?? null,
      conditionsNotes: input.conditionsNotes?.trim() || "",
      status,
      entries: {
        create: {
          action: "propose",
          actorRole: "trader",
          actorTraderId: input.traderId,
          message: input.message?.trim() || input.conditionsNotes?.trim() || "",
          proposedPrice:
            input.proposedPrice === undefined || input.proposedPrice === null
              ? null
              : input.proposedPrice,
          currency: input.currency?.trim().toUpperCase() || null,
          quantity: input.quantity ?? null,
          conditionsNotes: input.conditionsNotes?.trim() || null,
        },
      },
    },
    /** Slim write payload — detail pages load full relations separately. */
    select: { id: true, reference: true, status: true, productId: true },
  });
}

export type AddNegotiationInput = {
  dealId: string;
  action: NegotiationAction;
  actorRole: NegotiationActorRole;
  actorTraderId?: string | null;
  actorAdminId?: string | null;
  message?: string;
  proposedPrice?: number | null;
  currency?: string | null;
  quantity?: number | null;
  conditionsNotes?: string | null;
};

/**
 * Append a negotiation entry and update deal status.
 * Ownership / admin checks must be done by the caller using session identity.
 */
export async function addNegotiationEntry(input: AddNegotiationInput) {
  if (input.action === "propose") {
    throw new Error("PROPOSE_ONLY_ON_CREATE");
  }

  const deal = await prisma.dealProposal.findUnique({
    where: { id: input.dealId },
  });
  if (!deal) throw new Error("DEAL_NOT_FOUND");
  if (!isDealStatus(deal.status)) throw new Error("INVALID_STATUS");
  if (!isOpenDealStatus(deal.status)) {
    throw new Error("DEAL_NOT_OPEN");
  }

  if (input.actorRole === "trader") {
    if (!input.actorTraderId || input.actorTraderId !== deal.traderId) {
      throw new Error("FORBIDDEN");
    }
  }

  const nextStatus = nextDealStatusForAction(deal.status, input.action);

  let conflictWarnings: Awaited<ReturnType<typeof findCatalogDealConflicts>> =
    [];
  if (
    input.action === "accept" &&
    input.actorRole === "admin" &&
    deal.dealKind === "catalog" &&
    deal.productId
  ) {
    conflictWarnings = await findCatalogDealConflicts({
      productId: deal.productId,
      excludeDealId: deal.id,
      otherThanTraderId: deal.traderId,
    });
  }

  const price =
    input.proposedPrice === undefined ? undefined : input.proposedPrice;
  const currency =
    input.currency === undefined
      ? undefined
      : input.currency?.trim().toUpperCase() || null;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.negotiationEntry.create({
      data: {
        dealId: deal.id,
        action: input.action,
        actorRole: input.actorRole,
        actorTraderId: input.actorTraderId ?? null,
        actorAdminId: input.actorAdminId ?? null,
        message: input.message?.trim() || "",
        proposedPrice: price === undefined ? null : price,
        currency: currency === undefined ? null : currency,
        quantity: input.quantity === undefined ? null : input.quantity,
        conditionsNotes:
          input.conditionsNotes === undefined
            ? null
            : input.conditionsNotes?.trim() || null,
      },
    });

    const dealUpdate: {
      status: DealStatus;
      proposedPrice?: number | null;
      currency?: string | null;
      quantity?: number | null;
      conditionsNotes?: string;
    } = { status: nextStatus };

    // Counter updates the deal's current commercial snapshot when provided
    if (input.action === "counter") {
      if (price !== undefined) dealUpdate.proposedPrice = price;
      if (currency !== undefined) dealUpdate.currency = currency;
      if (input.quantity !== undefined) dealUpdate.quantity = input.quantity;
      if (input.conditionsNotes !== undefined) {
        dealUpdate.conditionsNotes = input.conditionsNotes?.trim() || "";
      }
    }

    return tx.dealProposal.update({
      where: { id: deal.id },
      data: dealUpdate,
      select: {
        id: true,
        status: true,
        proposedPrice: true,
        currency: true,
        quantity: true,
        traderId: true,
        reference: true,
        title: true,
      },
    });
  });

  // Notify the trader when admin acts (status center — §3.4).
  if (input.actorRole === "admin") {
    const actionLabelAr =
      input.action === "accept"
        ? "تم قبول الصفقة"
        : input.action === "reject"
          ? "رُفضت الصفقة"
          : input.action === "close"
            ? "أُغلقت الصفقة"
            : input.action === "counter"
              ? "عرض مقابل من الإدارة"
              : "تحديث على الصفقة";
    const actionLabelEn =
      input.action === "accept"
        ? "Deal accepted"
        : input.action === "reject"
          ? "Deal rejected"
          : input.action === "close"
            ? "Deal closed"
            : input.action === "counter"
              ? "Admin counter-offer"
              : "Deal update";
    const rejectReason =
      input.action === "reject" ? input.message?.trim() || "" : "";
    await notifyTrader({
      traderId: updated.traderId,
      domain: "deal",
      titleAr: `${actionLabelAr} · ${updated.reference}`,
      titleEn: `${actionLabelEn} · ${updated.reference}`,
      bodyAr: rejectReason
        ? `${updated.title} — ${rejectReason}`
        : updated.title,
      bodyEn: rejectReason
        ? `${updated.title} — ${rejectReason}`
        : updated.title,
      href: `/trader/deals/${updated.id}`,
    });
  }

  return { deal: updated, conflictWarnings };
}

/** Trader-scoped fetch — enforces ownership by session traderId. */
export async function getDealForTrader(dealId: string, traderId: string) {
  const deal = await prisma.dealProposal.findFirst({
    where: { id: dealId, traderId },
    include: {
      entries: { orderBy: { createdAt: "asc" } },
      product: true,
      trader: {
        select: {
          id: true,
          email: true,
          displayName: true,
          companyName: true,
          phone: true,
          status: true,
        },
      },
    },
  });
  if (!deal) throw new Error("DEAL_NOT_FOUND");
  return deal;
}

export async function listDealsForTrader(traderId: string) {
  return prisma.dealProposal.findMany({
    where: { AND: [{ traderId }, uiVisibleDealWhere()] },
    orderBy: { updatedAt: "desc" },
    include: {
      product: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
      entries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { actorRole: true },
      },
      _count: { select: { entries: true } },
    },
  });
}

export async function getDealForAdmin(dealId: string) {
  const deal = await prisma.dealProposal.findUnique({
    where: { id: dealId },
    include: {
      entries: { orderBy: { createdAt: "asc" } },
      product: true,
      trader: true,
      curatedOffers: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!deal) throw new Error("DEAL_NOT_FOUND");
  return deal;
}

export async function listDealsForAdmin() {
  return prisma.dealProposal.findMany({
    where: uiVisibleDealWhere(),
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      trader: {
        select: { id: true, email: true, displayName: true, companyName: true },
      },
      product: { select: { id: true, slug: true, nameEn: true, nameAr: true } },
      entries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { actorRole: true },
      },
      _count: { select: { entries: true } },
    },
  });
}
