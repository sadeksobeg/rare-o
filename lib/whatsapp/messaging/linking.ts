/**
 * Explicit WhatsApp conversation ↔ Week 3 domain linking (Phase D).
 *
 * ONE active primary link per conversation.
 * Does not merge domains, create business records, or change statuses.
 */

import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import {
  isWhatsAppActiveLinkType,
  isWhatsAppLinkType,
  type WhatsAppActiveLinkType,
  type WhatsAppLinkType,
} from "@/lib/whatsapp/messaging/link-constants";

export type DbClient = PrismaClient;

export type LinkConversationInput = {
  conversationId: string;
  linkType: string;
  linkId: string;
  adminId: string;
};

export type ClearConversationLinkInput = {
  conversationId: string;
  adminId: string;
};

export type LinkMutationResult =
  | {
      ok: true;
      conversationId: string;
      linkType: WhatsAppLinkType;
      linkId: string | null;
      action: "set" | "change" | "clear";
    }
  | {
      ok: false;
      code:
        | "CONVERSATION_NOT_FOUND"
        | "UNSUPPORTED_LINK_TYPE"
        | "TARGET_NOT_FOUND"
        | "INVALID_INPUT"
        | "UNAUTHORIZED_TARGET";
      error: string;
    };

export type BusinessContextLine = {
  nameAr: string;
  nameEn: string;
  quantity: number;
};

export type BusinessContextView =
  | { linked: false }
  | {
      linked: true;
      linkType: WhatsAppActiveLinkType;
      recordId: string;
      reference: string;
      status: string;
      updatedAt: string;
      adminHref: string;
      identityLabel: string;
      identityDetail: string | null;
      title: string | null;
      dealKind: string | null;
      requestMode: string | null;
      productLabel: string | null;
      latestNegotiation: string | null;
      lines: BusinessContextLine[];
    };

/**
 * Verify target exists via strict allowlist. Never accepts Prisma model names.
 * Returns false if missing. Unauthorized-target is for future scoped checks;
 * admin linking requires existence only.
 */
export async function assertLinkTargetExists(
  linkType: WhatsAppActiveLinkType,
  linkId: string,
  db: DbClient = defaultPrisma
): Promise<boolean> {
  const id = linkId.trim();
  if (!id) return false;

  switch (linkType) {
    case "retail_request": {
      const row = await db.retailRequest.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!row;
    }
    case "deal_proposal": {
      const row = await db.dealProposal.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!row;
    }
    case "wholesale_request": {
      const row = await db.wholesaleRequest.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!row;
    }
    case "brokerage_request": {
      const row = await db.brokerageRequest.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!row;
    }
    default:
      return false;
  }
}

/**
 * Set or change the single primary business link.
 * Auditable. Does not mutate the target domain record.
 */
export async function linkConversationToBusinessRecord(
  input: LinkConversationInput,
  db: DbClient = defaultPrisma
): Promise<LinkMutationResult> {
  const conversationId = input.conversationId?.trim() ?? "";
  const linkId = input.linkId?.trim() ?? "";
  const adminId = input.adminId?.trim() ?? "";
  const rawType = input.linkType?.trim() ?? "";

  if (!conversationId || !adminId || !linkId) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      error: "conversationId, linkId, and adminId are required",
    };
  }
  if (!isWhatsAppActiveLinkType(rawType)) {
    return {
      ok: false,
      code: "UNSUPPORTED_LINK_TYPE",
      error: "Unsupported link type",
    };
  }

  const conversation = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      linkType: true,
      linkId: true,
    },
  });
  if (!conversation) {
    return {
      ok: false,
      code: "CONVERSATION_NOT_FOUND",
      error: "Conversation not found",
    };
  }

  const exists = await assertLinkTargetExists(rawType, linkId, db);
  if (!exists) {
    return {
      ok: false,
      code: "TARGET_NOT_FOUND",
      error: "Target business record not found",
    };
  }

  const previousType = isWhatsAppLinkType(conversation.linkType)
    ? conversation.linkType
    : "none";
  const previousId = conversation.linkId;
  const action =
    previousType === "none" || !previousId ? "set" : "change";

  await db.$transaction(async (tx) => {
    await tx.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        linkType: rawType,
        linkId,
        linkedAt: new Date(),
        linkedByAdminId: adminId,
      },
    });
    await tx.whatsAppLinkAudit.create({
      data: {
        conversationId,
        action,
        previousLinkType: previousType,
        previousLinkId: previousId,
        newLinkType: rawType,
        newLinkId: linkId,
        adminId,
      },
    });
  });

  return {
    ok: true,
    conversationId,
    linkType: rawType,
    linkId,
    action,
  };
}

/**
 * Clear the primary business link (set to none).
 */
export async function clearConversationBusinessLink(
  input: ClearConversationLinkInput,
  db: DbClient = defaultPrisma
): Promise<LinkMutationResult> {
  const conversationId = input.conversationId?.trim() ?? "";
  const adminId = input.adminId?.trim() ?? "";
  if (!conversationId || !adminId) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      error: "conversationId and adminId are required",
    };
  }

  const conversation = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, linkType: true, linkId: true },
  });
  if (!conversation) {
    return {
      ok: false,
      code: "CONVERSATION_NOT_FOUND",
      error: "Conversation not found",
    };
  }

  const previousType = isWhatsAppLinkType(conversation.linkType)
    ? conversation.linkType
    : "none";
  const previousId = conversation.linkId;

  if (previousType === "none" && !previousId) {
    return {
      ok: true,
      conversationId,
      linkType: "none",
      linkId: null,
      action: "clear",
    };
  }

  await db.$transaction(async (tx) => {
    await tx.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        linkType: "none",
        linkId: null,
        linkedAt: null,
        linkedByAdminId: null,
      },
    });
    await tx.whatsAppLinkAudit.create({
      data: {
        conversationId,
        action: "clear",
        previousLinkType: previousType,
        previousLinkId: previousId,
        newLinkType: "none",
        newLinkId: null,
        adminId,
      },
    });
  });

  return {
    ok: true,
    conversationId,
    linkType: "none",
    linkId: null,
    action: "clear",
  };
}

function toIso(d: Date): string {
  return d.toISOString();
}

export type LinkAuditEntry = {
  id: string;
  action: "set" | "change" | "clear";
  previousLinkType: string | null;
  newLinkType: string;
  newLinkId: string | null;
  createdAt: string;
};

/** Most recent link/unlink audit rows for a conversation (newest first). */
export async function listRecentLinkAudits(
  conversationId: string,
  limit = 5,
  db: DbClient = defaultPrisma
): Promise<LinkAuditEntry[]> {
  const rows = await db.whatsAppLinkAudit.findMany({
    where: { conversationId: conversationId.trim() },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      previousLinkType: true,
      newLinkType: true,
      newLinkId: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    action: (r.action === "change" || r.action === "clear"
      ? r.action
      : "set") as LinkAuditEntry["action"],
    previousLinkType: r.previousLinkType,
    newLinkType: r.newLinkType,
    newLinkId: r.newLinkId,
    createdAt: toIso(r.createdAt),
  }));
}

/**
 * Load compact business context for a linked conversation.
 * Domain status is the source of truth — never derived from messages.
 */
export async function getBusinessContextForConversation(
  conversationId: string,
  db: DbClient = defaultPrisma
): Promise<BusinessContextView> {
  const conversation = await db.whatsAppConversation.findUnique({
    where: { id: conversationId.trim() },
    select: { linkType: true, linkId: true },
  });
  if (
    !conversation ||
    !conversation.linkId ||
    !isWhatsAppActiveLinkType(conversation.linkType)
  ) {
    return { linked: false };
  }

  const linkType = conversation.linkType;
  const linkId = conversation.linkId;

  if (linkType === "retail_request") {
    const row = await db.retailRequest.findUnique({
      where: { id: linkId },
      include: {
        lines: {
          select: {
            productNameAr: true,
            productNameEn: true,
            quantity: true,
          },
        },
      },
    });
    if (!row) return { linked: false };
    return {
      linked: true,
      linkType,
      recordId: row.id,
      reference: row.reference,
      status: row.status,
      updatedAt: toIso(row.updatedAt),
      adminHref: `/admin/requests/${row.id}`,
      identityLabel: row.customerName,
      identityDetail: row.customerPhone,
      title: null,
      dealKind: null,
      requestMode: null,
      productLabel: null,
      latestNegotiation: null,
      lines: row.lines.map((l) => ({
        nameAr: l.productNameAr,
        nameEn: l.productNameEn,
        quantity: l.quantity,
      })),
    };
  }

  if (linkType === "deal_proposal") {
    const row = await db.dealProposal.findUnique({
      where: { id: linkId },
      include: {
        trader: {
          select: {
            displayName: true,
            email: true,
            companyName: true,
          },
        },
        product: {
          select: { nameAr: true, nameEn: true, slug: true },
        },
        entries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { action: true, message: true, createdAt: true },
        },
      },
    });
    if (!row) return { linked: false };
    const latest = row.entries[0];
    const productLabel = row.product
      ? row.product.nameEn || row.product.nameAr || row.product.slug
      : null;
    return {
      linked: true,
      linkType,
      recordId: row.id,
      reference: row.reference,
      status: row.status,
      updatedAt: toIso(row.updatedAt),
      adminHref: `/admin/deals/${row.id}`,
      identityLabel: row.trader.displayName || row.trader.email,
      identityDetail: row.trader.companyName || row.trader.email,
      title: row.title,
      dealKind: row.dealKind,
      requestMode: null,
      productLabel,
      latestNegotiation: latest
        ? `${latest.action}${latest.message ? `: ${latest.message.slice(0, 120)}` : ""}`
        : null,
      lines: [],
    };
  }

  if (linkType === "wholesale_request") {
    const row = await db.wholesaleRequest.findUnique({
      where: { id: linkId },
      include: {
        trader: {
          select: {
            displayName: true,
            email: true,
            companyName: true,
          },
        },
        lines: {
          select: {
            productNameAr: true,
            productNameEn: true,
            quantity: true,
          },
        },
      },
    });
    if (!row) return { linked: false };
    return {
      linked: true,
      linkType,
      recordId: row.id,
      reference: row.reference,
      status: row.status,
      updatedAt: toIso(row.updatedAt),
      adminHref: `/admin/wholesale/${row.id}`,
      identityLabel: row.trader.displayName || row.trader.email,
      identityDetail: row.trader.companyName || row.trader.email,
      title: null,
      dealKind: null,
      requestMode: row.requestMode,
      productLabel: null,
      latestNegotiation: null,
      lines: row.lines.map((l) => ({
        nameAr: l.productNameAr,
        nameEn: l.productNameEn,
        quantity: l.quantity,
      })),
    };
  }

  // brokerage_request
  const row = await db.brokerageRequest.findUnique({
    where: { id: linkId },
    include: {
      trader: {
        select: {
          displayName: true,
          email: true,
          companyName: true,
        },
      },
    },
  });
  if (!row) return { linked: false };
  return {
    linked: true,
    linkType,
    recordId: row.id,
    reference: row.reference,
    status: row.status,
    updatedAt: toIso(row.updatedAt),
    adminHref: `/admin/brokerage/${row.id}`,
    identityLabel: row.trader.displayName || row.trader.email,
    identityDetail: row.trader.companyName || row.trader.email,
    title: row.descriptionAr.slice(0, 80) || null,
    dealKind: null,
    requestMode: null,
    productLabel: null,
    latestNegotiation: null,
    lines: [],
  };
}

export type CrmPartySuggestion = {
  kind: "customer" | "trader";
  id: string;
  label: string;
  phone: string;
};

/** Suggest CRM parties from conversation E.164 (digits). Owner must confirm. */
export async function suggestCrmPartiesForConversation(
  conversationId: string,
  db: DbClient = defaultPrisma
): Promise<CrmPartySuggestion[]> {
  const conversation = await db.whatsAppConversation.findUnique({
    where: { id: conversationId.trim() },
    select: { participantE164: true },
  });
  const phone = conversation?.participantE164?.replace(/\D/g, "") ?? "";
  if (phone.length < 8) return [];

  const [customers, traders] = await Promise.all([
    db.customer.findMany({
      where: { phone: { contains: phone.slice(-9) } },
      take: 5,
      select: { id: true, name: true, phone: true },
    }),
    db.traderAccount.findMany({
      where: { phone: { contains: phone.slice(-9) } },
      take: 5,
      select: { id: true, displayName: true, companyName: true, phone: true },
    }),
  ]);

  return [
    ...customers.map((c) => ({
      kind: "customer" as const,
      id: c.id,
      label: c.name,
      phone: c.phone,
    })),
    ...traders.map((t) => ({
      kind: "trader" as const,
      id: t.id,
      label: t.displayName || t.companyName || t.id,
      phone: t.phone,
    })),
  ];
}

export async function setConversationCrmParty(
  input: {
    conversationId: string;
    customerId?: string | null;
    traderId?: string | null;
    adminId: string;
  },
  db: DbClient = defaultPrisma
): Promise<
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "INVALID_INPUT" | "TARGET_NOT_FOUND"; error: string }
> {
  const conversationId = input.conversationId.trim();
  if (!conversationId || !input.adminId.trim()) {
    return { ok: false, code: "INVALID_INPUT", error: "Missing ids" };
  }

  const conversation = await db.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });
  if (!conversation) {
    return { ok: false, code: "NOT_FOUND", error: "Conversation not found" };
  }

  const clearBoth =
    input.customerId === null &&
    input.traderId === null &&
    input.customerId !== undefined &&
    input.traderId !== undefined;

  const customerIdRaw =
    input.customerId === undefined ? undefined : input.customerId?.trim() || null;
  const traderIdRaw =
    input.traderId === undefined ? undefined : input.traderId?.trim() || null;

  if (customerIdRaw) {
    const c = await db.customer.findUnique({
      where: { id: customerIdRaw },
      select: { id: true },
    });
    if (!c) {
      return { ok: false, code: "TARGET_NOT_FOUND", error: "Customer not found" };
    }
    await db.whatsAppConversation.update({
      where: { id: conversationId },
      data: { customerId: customerIdRaw, traderId: null },
    });
    return { ok: true };
  }

  if (traderIdRaw) {
    const t = await db.traderAccount.findUnique({
      where: { id: traderIdRaw },
      select: { id: true },
    });
    if (!t) {
      return { ok: false, code: "TARGET_NOT_FOUND", error: "Trader not found" };
    }
    await db.whatsAppConversation.update({
      where: { id: conversationId },
      data: { traderId: traderIdRaw, customerId: null },
    });
    return { ok: true };
  }

  if (clearBoth || (customerIdRaw === null && traderIdRaw === null)) {
    await db.whatsAppConversation.update({
      where: { id: conversationId },
      data: { customerId: null, traderId: null },
    });
    return { ok: true };
  }

  return { ok: false, code: "INVALID_INPUT", error: "No CRM party specified" };
}
