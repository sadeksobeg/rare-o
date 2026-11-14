import { randomInt } from "node:crypto";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";
import { notifyTraderChannels, traderPortalUrl } from "@/lib/trader/notify-channels";
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

const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** DP-YYYY-XXXXXX — unguessable, collision-safe (the old 4-digit form had only 9000 values). */
function buildDealReference(now = new Date()): string {
  const y = now.getUTCFullYear();
  let code = "";
  for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `DP-${y}-${code}`;
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
      mustChangePassword: true,
    },
  });
}

/** Admin reset: new temp password, forces the change-password screen on next sign-in. */
export async function resetTraderAccountPassword(
  traderId: string,
  tempPassword: string
) {
  const passwordHash = await hashPassword(tempPassword);
  return prisma.traderAccount.update({
    where: { id: traderId },
    data: { passwordHash, mustChangePassword: true },
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
  modelNumber: string;
  /** Required — trader-stated price (payment-first, 2026-11-03) */
  proposedPrice: number;
  currency: string;
  quantity?: number | null;
  conditionsNotes?: string;
  message?: string;
};

export async function createDealProposal(input: CreateDealInput) {
  if (!DEAL_KINDS.includes(input.dealKind)) {
    throw new Error("INVALID_DEAL_KIND");
  }
  const modelNumber = input.modelNumber.trim();
  if (!modelNumber) throw new Error("MODEL_NUMBER_REQUIRED");
  if (!Number.isFinite(input.proposedPrice) || input.proposedPrice <= 0) {
    throw new Error("PRICE_REQUIRED");
  }
  const currency = input.currency.trim().toUpperCase();
  if (!currency) throw new Error("CURRENCY_REQUIRED");

  let productId: string | null = null;
  if (input.dealKind === "catalog") {
    if (!input.productId) throw new Error("CATALOG_PRODUCT_REQUIRED");
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    productId = product.id;
  } else {
    if (input.productId) throw new Error("NON_CATALOG_MUST_NOT_REFERENCE_PRODUCT");
    productId = null;
  }

  const status: DealStatus = "proposed";

  const createOnce = (reference: string) =>
    prisma.dealProposal.create({
    data: {
      reference,
      traderId: input.traderId,
      dealKind: input.dealKind,
      title: input.title.trim(),
      productId,
      modelNumber,
      proposedPrice: input.proposedPrice,
      currency,
      quantity: input.quantity ?? null,
      conditionsNotes: input.conditionsNotes?.trim() || "",
      status,
      entries: {
        create: {
          action: "propose",
          actorRole: "trader",
          actorTraderId: input.traderId,
          message: input.message?.trim() || input.conditionsNotes?.trim() || "",
          proposedPrice: input.proposedPrice,
          currency,
          quantity: input.quantity ?? null,
          conditionsNotes: input.conditionsNotes?.trim() || null,
        },
      },
    },
    select: { id: true, reference: true, status: true, productId: true },
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await createOnce(buildDealReference());
      void publishInboxEvent("conversation.updated", {
        kind: "deal_proposed",
        domain: "deal",
        requestId: created.id,
        title: created.reference,
      });
      return created;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
      lastErr = e;
    }
  }
  throw lastErr;
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
      handoffMessageText?: string | null;
      whatsAppDeepLink?: string | null;
      handoffPreparedAt?: Date | null;
    } = { status: nextStatus };

    // Payment-first: counter may update qty/conditions only — not price.
    if (input.action === "counter") {
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
        modelNumber: true,
      },
    });
  });

  // After accept → prepare WhatsApp payment handoff on the deal row.
  if (input.action === "accept" && updated.status === "awaiting_payment") {
    try {
      const trader = await prisma.traderAccount.findUnique({
        where: { id: updated.traderId },
        select: { displayName: true, email: true },
      });
      const {
        buildDealPaymentHandoffMessage,
        preparePaymentHandoff,
      } = await import("@/lib/whatsapp/payment-handoff");
      const priceStr =
        updated.proposedPrice != null ? String(updated.proposedPrice) : "—";
      const messageText = buildDealPaymentHandoffMessage({
        locale: "ar",
        reference: updated.reference,
        title: updated.title,
        modelNumber: updated.modelNumber ?? "",
        price: priceStr,
        currency: updated.currency ?? "USD",
        traderName: trader?.displayName || trader?.email || "",
      });
      const prepared = await preparePaymentHandoff(messageText);
      await prisma.dealProposal.update({
        where: { id: updated.id },
        data: {
          handoffMessageText: prepared.messageText,
          whatsAppDeepLink: prepared.deepLink,
          handoffPreparedAt: new Date(),
        },
      });
    } catch {
      /* E164 missing — status still awaiting_payment */
    }
  }

  // Live toast for the admin team when the trader acts.
  if (input.actorRole === "trader") {
    void publishInboxEvent("conversation.updated", {
      kind:
        input.action === "accept"
          ? "deal_trader_accepted"
          : input.action === "reject"
            ? "deal_trader_rejected"
            : input.action === "close"
              ? "deal_trader_closed"
              : "deal_trader_reply",
      domain: "deal",
      requestId: updated.id,
      title: updated.reference,
    });
  }

  // Notify the trader when admin acts (status center — §3.4).
  if (input.actorRole === "admin") {
    const actionLabelAr =
      input.action === "accept"
        ? "قُبلت الشروط — بانتظار الدفع"
        : input.action === "reject"
          ? "رُفضت الصفقة"
          : input.action === "close"
            ? "أُغلقت الصفقة"
            : input.action === "counter"
              ? "رد من الإدارة (بدون تغيير السعر)"
              : "تحديث على الصفقة";
    const actionLabelEn =
      input.action === "accept"
        ? "Terms accepted — awaiting payment"
        : input.action === "reject"
          ? "Deal rejected"
          : input.action === "close"
            ? "Deal closed"
            : input.action === "counter"
              ? "Admin reply (price unchanged)"
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
    // Platform inbox + WhatsApp, so a WhatsApp outage never leaves the trader unaware.
    if (input.actorAdminId) {
      const tr = await prisma.traderAccount.findUnique({
        where: { id: updated.traderId },
        select: { displayName: true },
      });
      const first = (tr?.displayName ?? "").trim().split(/\s+/)[0];
      await notifyTraderChannels({
        traderId: updated.traderId,
        adminId: input.actorAdminId,
        text: `أهلاً ${first || ""}، ${actionLabelAr} — صفقة ${updated.reference}${rejectReason ? `
السبب: ${rejectReason}` : ""}
التفاصيل: ${traderPortalUrl(`/trader/deals/${updated.id}`)}`,
      });
    }
  }

  return { deal: updated, conflictWarnings };
}

/** Admin confirms offline payment; closes the payment-first deal path. */
export async function confirmDealPayment(input: {
  dealId: string;
  adminId: string;
}) {
  const deal = await prisma.dealProposal.findUnique({ where: { id: input.dealId } });
  if (!deal) throw new Error("DEAL_NOT_FOUND");
  if (deal.status !== "awaiting_payment") throw new Error("INVALID_STATUS");

  const updated = await prisma.dealProposal.update({
    where: { id: input.dealId },
    data: {
      status: "payment_confirmed",
      paymentConfirmedAt: new Date(),
      paymentConfirmedByAdminId: input.adminId,
    },
  });

  await notifyTrader({
    traderId: deal.traderId,
    domain: "deal",
    titleAr: `تأكيد دفع الصفقة · ${deal.reference}`,
    titleEn: `Deal payment confirmed · ${deal.reference}`,
    bodyAr: "أكدت الإدارة استلام الدفع واكتمال الطلب.",
    bodyEn: "Admin confirmed payment and completed the order.",
    href: `/trader/deals/${deal.id}`,
  });
  await notifyTraderChannels({
    traderId: deal.traderId,
    adminId: input.adminId,
    text: `تم تأكيد استلام دفعة صفقتك ${deal.reference}. شكراً لك!
التفاصيل: ${traderPortalUrl(`/trader/deals/${deal.id}`)}`,
  });

  return updated;
}

export async function markDealHandoffOpened(input: {
  dealId: string;
  traderId: string;
}) {
  const deal = await prisma.dealProposal.findFirst({
    where: { id: input.dealId, traderId: input.traderId },
  });
  if (!deal) throw new Error("DEAL_NOT_FOUND");
  if (deal.handoffOpenedAt) return deal;
  return prisma.dealProposal.update({
    where: { id: input.dealId },
    data: { handoffOpenedAt: new Date() },
  });
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
  // Trader always sees their own deals. Admin lists keep uiVisibleDealWhere().
  return prisma.dealProposal.findMany({
    where: { traderId },
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
