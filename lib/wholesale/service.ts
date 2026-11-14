import { uiVisibleWholesaleWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { notifyTrader } from "@/lib/trader/notifications";
import {
  buildQuoteSnapshot,
  quote,
} from "@/lib/shipping/engine";
import {
  WHOLESALE_QTY_TECHNICAL_MAX,
  canTransitionWholesale,
  isOpenWholesaleStatus,
  isWholesaleRequestMode,
  isWholesaleStatus,
  type WholesaleRequestMode,
  type WholesaleStatus,
} from "@/lib/wholesale/constants";

/**
 * Builds and persists the WhatsApp handoff for a just-confirmed wholesale
 * request. Best-effort: a missing WHATSAPP_BUSINESS_E164 must not block the
 * status transition that already committed — the request stays "confirmed"
 * and an admin can still reach the trader directly; this only skips the
 * prefilled deep link.
 */
async function prepareWholesaleHandoffForRequest(
  requestId: string,
  locale: "ar" | "en"
): Promise<void> {
  try {
    const request = await prisma.wholesaleRequest.findUnique({
      where: { id: requestId },
      include: {
        lines: true,
        trader: { select: { displayName: true, companyName: true, phone: true } },
      },
    });
    if (!request) return;

    const { buildWholesaleHandoffMessage, prepareWholesaleHandoff } =
      await import("@/lib/whatsapp/wholesale-handoff");

    const messageText = buildWholesaleHandoffMessage({
      locale,
      reference: request.reference,
      requestMode: request.requestMode as WholesaleRequestMode,
      traderName: request.trader.displayName,
      traderCompany: request.trader.companyName,
      traderPhone: request.trader.phone,
      lines: request.lines.map((l) => ({
        nameAr: l.productNameAr,
        nameEn: l.productNameEn,
        quantity: l.quantity,
        unitPrice:
          l.quotedUnitPrice != null
            ? Number(l.quotedUnitPrice)
            : l.proposedUnitPrice != null
              ? Number(l.proposedUnitPrice)
              : null,
        currency: l.currency,
      })),
      quoteMessage: request.quoteMessage,
      destinationCountry: request.destinationCountry,
      shippingMethodLabel: request.shippingMethodLabel,
      shippingCost:
        request.shippingCostAmount != null && request.shippingCostCurrency
          ? {
              amount: Number(request.shippingCostAmount),
              currency: request.shippingCostCurrency,
            }
          : null,
      traderNotes: request.traderNotes,
    });

    const prepared = await prepareWholesaleHandoff(messageText);
    await prisma.wholesaleRequest.update({
      where: { id: request.id },
      data: {
        handoffMessageText: prepared.messageText,
        whatsAppDeepLink: prepared.deepLink,
        handoffPreparedAt: new Date(),
      },
    });
  } catch (err) {
    console.error(
      "[wholesale] handoff preparation failed (status transition already committed):",
      err instanceof Error ? err.message : err
    );
  }
}

function buildReference(now = new Date()): string {
  const y = now.getUTCFullYear();
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `WH-${y}-${n}`;
}

export type WholesaleLineInput = {
  productId: string;
  quantity: number;
  /** Required when requestMode is propose_price */
  proposedUnitPrice?: number | null;
  currency?: string | null;
};

export type CreateWholesaleRequestInput = {
  /** Always from authenticated session — never from client as auth source */
  traderId: string;
  requestMode: WholesaleRequestMode;
  traderNotes?: string;
  lines: WholesaleLineInput[];
  destinationCountry?: string | null;
  destinationCode?: string | null;
  shippingMethodCode?: string | null;
  shippingMethodLabel?: string | null;
};

export function isWholesaleEligibleProduct(product: {
  status: string;
  wholesaleEligible: boolean;
}): boolean {
  return product.status === "published" && product.wholesaleEligible === true;
}

export async function listWholesaleEligibleProducts() {
  return prisma.product.findMany({
    where: { status: "published", wholesaleEligible: true },
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      nameEn: true,
      currency: true,
      retailPrice: true,
      category: { select: { nameEn: true, nameAr: true, slug: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { path: true, altAr: true, altEn: true },
      },
    },
  });
}

export async function createWholesaleRequest(input: CreateWholesaleRequestInput) {
  if (!isWholesaleRequestMode(input.requestMode)) {
    throw new Error("INVALID_REQUEST_MODE");
  }
  if (!input.lines.length) throw new Error("LINES_REQUIRED");

  const productIds = input.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const resolved: Array<{
    productId: string;
    productNameAr: string;
    productNameEn: string;
    productSlugSnapshot: string;
    quantity: number;
    proposedUnitPrice: number | null;
    currency: string | null;
    catalogRetailPriceSnapshot: number | null;
    catalogCurrencySnapshot: string | null;
  }> = [];

  for (const line of input.lines) {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > WHOLESALE_QTY_TECHNICAL_MAX
    ) {
      throw new Error("INVALID_QUANTITY");
    }
    const product = byId.get(line.productId);
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    // Re-validate eligibility server-side at submission
    if (!isWholesaleEligibleProduct(product)) {
      throw new Error("PRODUCT_NOT_WHOLESALE_ELIGIBLE");
    }

    let proposedUnitPrice: number | null = null;
    let currency: string | null = null;

    if (input.requestMode === "propose_price") {
      if (
        line.proposedUnitPrice == null ||
        Number.isNaN(line.proposedUnitPrice) ||
        line.proposedUnitPrice < 0
      ) {
        throw new Error("PROPOSED_PRICE_REQUIRED");
      }
      if (!line.currency) throw new Error("CURRENCY_REQUIRED");
      proposedUnitPrice = line.proposedUnitPrice;
      currency = line.currency.trim().toUpperCase();
    } else {
      // request_quote: do not invent wholesale pricing
      proposedUnitPrice = null;
      currency = null;
    }

    resolved.push({
      productId: product.id,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      productSlugSnapshot: product.slug,
      quantity: line.quantity,
      proposedUnitPrice,
      currency,
      catalogRetailPriceSnapshot:
        product.retailPrice != null ? Number(product.retailPrice) : null,
      catalogCurrencySnapshot: product.currency ?? null,
    });
  }

  const reference = buildReference();
  const status: WholesaleStatus = "submitted";

  const declaredValue = resolved.reduce((sum, l) => {
    if (l.proposedUnitPrice == null) return sum;
    return sum + l.proposedUnitPrice * l.quantity;
  }, 0);
  const quoteResult = input.destinationCode
    ? await quote({
        destinationCode: input.destinationCode,
        items: resolved.map((l) => ({
          productId: l.productId,
          qty: l.quantity,
        })),
        declaredValue: declaredValue > 0 ? declaredValue : null,
        audience: "TRADER",
      })
    : null;
  const shippingWeightKg = quoteResult?.weightKg ?? null;
  let shippingMethodCode: string | null = null;
  let shippingMethodLabel: string | null = null;
  let shippingCostAmount: number | null = null;
  let shippingCostCurrency: string | null = null;
  let shippingQuoteSnapshot: ReturnType<typeof buildQuoteSnapshot> | undefined;

  if (input.destinationCode && input.shippingMethodCode) {
    const match = quoteResult?.methods.find(
      (m) => m.methodCode === input.shippingMethodCode
    );
    if (!match) throw new Error("SHIPPING_METHOD_NOT_AVAILABLE");
    shippingMethodCode = match.methodCode;
    shippingMethodLabel =
      input.shippingMethodLabel?.trim() || match.labelAr;
    shippingCostAmount = match.price.total;
    shippingCostCurrency = match.price.currency;
    shippingQuoteSnapshot = buildQuoteSnapshot(quoteResult!, shippingMethodCode);
  } else if (quoteResult) {
    shippingQuoteSnapshot = buildQuoteSnapshot(quoteResult, null);
  }

  return prisma.wholesaleRequest.create({
    data: {
      reference,
      traderId: input.traderId,
      requestMode: input.requestMode,
      status,
      traderNotes: input.traderNotes?.trim() || "",
      destinationCountry: input.destinationCountry?.trim() || null,
      destinationCode: input.destinationCode?.trim() || null,
      shippingMethodCode,
      shippingMethodLabel,
      shippingCostAmount,
      shippingCostCurrency,
      shippingWeightKg,
      shippingQuoteSnapshot,
      lines: {
        create: resolved.map((l) => ({
          productId: l.productId,
          productNameAr: l.productNameAr,
          productNameEn: l.productNameEn,
          productSlugSnapshot: l.productSlugSnapshot,
          quantity: l.quantity,
          proposedUnitPrice: l.proposedUnitPrice,
          quotedUnitPrice: null,
          currency: l.currency,
          catalogRetailPriceSnapshot: l.catalogRetailPriceSnapshot,
          catalogCurrencySnapshot: l.catalogCurrencySnapshot,
        })),
      },
      events: {
        create: {
          eventType: "submitted",
          fromStatus: null,
          toStatus: status,
          actorRole: "trader",
          actorTraderId: input.traderId,
          note: null,
        },
      },
    },
    include: { lines: true },
  });
}

export async function markWholesaleHandoffOpened(input: {
  requestId: string;
  traderId: string;
}) {
  const request = await prisma.wholesaleRequest.findFirst({
    where: { id: input.requestId, traderId: input.traderId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (request.handoffOpenedAt) return request;
  return prisma.wholesaleRequest.update({
    where: { id: input.requestId },
    data: { handoffOpenedAt: new Date() },
  });
}

/** Ownership-scoped fetch — prevents IDOR */
export async function getWholesaleRequestForTrader(
  requestId: string,
  traderId: string
) {
  const request = await prisma.wholesaleRequest.findFirst({
    where: { id: requestId, traderId },
    include: {
      lines: true,
      events: { orderBy: { createdAt: "asc" } },
      trader: {
        select: {
          id: true,
          email: true,
          displayName: true,
          companyName: true,
          phone: true,
        },
      },
    },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  return request;
}

export async function listWholesaleRequestsForTrader(traderId: string) {
  // Trader always sees their own requests. Admin lists keep uiVisibleWholesaleWhere().
  return prisma.wholesaleRequest.findMany({
    where: { traderId },
    orderBy: { updatedAt: "desc" },
    include: {
      lines: true,
      _count: { select: { lines: true, events: true } },
    },
  });
}

export async function getWholesaleRequestForAdmin(requestId: string) {
  const request = await prisma.wholesaleRequest.findUnique({
    where: { id: requestId },
    include: {
      lines: true,
      events: { orderBy: { createdAt: "asc" } },
      trader: true,
    },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  return request;
}

export async function listWholesaleRequestsForAdmin() {
  return prisma.wholesaleRequest.findMany({
    where: uiVisibleWholesaleWhere(),
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      trader: {
        select: { id: true, email: true, displayName: true, companyName: true },
      },
      _count: { select: { lines: true } },
    },
  });
}

export async function adminTransitionWholesaleStatus(input: {
  requestId: string;
  toStatus: WholesaleStatus;
  actorAdminId: string;
  note?: string;
  locale?: "ar" | "en";
}) {
  const request = await prisma.wholesaleRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!isWholesaleStatus(request.status)) throw new Error("INVALID_STATUS");
  if (!canTransitionWholesale(request.status, input.toStatus)) {
    throw new Error("INVALID_TRANSITION");
  }

  // Confirming from under_review without quote is only for propose_price
  if (
    input.toStatus === "confirmed" &&
    request.status === "under_review" &&
    request.requestMode === "request_quote"
  ) {
    throw new Error("QUOTE_REQUIRED_BEFORE_CONFIRM");
  }

  const now = new Date();
  const data: {
    status: WholesaleStatus;
    confirmedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
  } = { status: input.toStatus };

  if (input.toStatus === "confirmed") data.confirmedAt = now;
  if (input.toStatus === "completed") data.completedAt = now;
  if (input.toStatus === "cancelled") data.cancelledAt = now;

  const updated = await prisma.wholesaleRequest.update({
    where: { id: request.id },
    data: {
      ...data,
      events: {
        create: {
          eventType: "status_changed",
          fromStatus: request.status,
          toStatus: input.toStatus,
          actorRole: "admin",
          actorAdminId: input.actorAdminId,
          note: input.note ?? null,
        },
      },
    },
    include: { lines: true, events: { orderBy: { createdAt: "asc" } } },
  });

  if (input.toStatus === "confirmed") {
    await prepareWholesaleHandoffForRequest(updated.id, input.locale ?? "ar");
  }

  const statusAr =
    getDictionary("ar").trader.wholesaleStatus[input.toStatus] ?? input.toStatus;
  const statusEn =
    getDictionary("en").trader.wholesaleStatus[input.toStatus] ?? input.toStatus;
  await notifyTrader({
    traderId: updated.traderId,
    domain: "wholesale",
    titleAr: `تحديث طلب جملة · ${updated.reference}`,
    titleEn: `Wholesale update · ${updated.reference}`,
    bodyAr: `طلب الجملة أصبح: ${statusAr}`,
    bodyEn: `Wholesale request is now ${statusEn}.`,
    href: `/trader/wholesale/${updated.id}`,
  });

  return updated;
}

export type QuoteLineInput = {
  lineId: string;
  quotedUnitPrice: number;
};

export async function adminProvideWholesaleQuote(input: {
  requestId: string;
  actorAdminId: string;
  quoteMessage?: string;
  quoteCurrency: string;
  lineQuotes: QuoteLineInput[];
}) {
  const request = await prisma.wholesaleRequest.findUnique({
    where: { id: input.requestId },
    include: { lines: true },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!isWholesaleStatus(request.status)) throw new Error("INVALID_STATUS");
  if (request.status !== "under_review" && request.status !== "submitted") {
    // Allow quote from submitted by first moving conceptually — or require under_review
    if (
      request.status !== "quote_provided" &&
      !canTransitionWholesale(request.status, "quote_provided")
    ) {
      throw new Error("QUOTE_NOT_ALLOWED");
    }
  }
  if (
    request.status !== "submitted" &&
    request.status !== "under_review" &&
    request.status !== "quote_provided"
  ) {
    throw new Error("QUOTE_NOT_ALLOWED");
  }

  const currency = input.quoteCurrency.trim().toUpperCase();
  if (!currency) throw new Error("CURRENCY_REQUIRED");

  const lineIds = new Set(request.lines.map((l) => l.id));
  if (!input.lineQuotes.length) throw new Error("LINE_QUOTES_REQUIRED");
  for (const q of input.lineQuotes) {
    if (!lineIds.has(q.lineId)) throw new Error("INVALID_LINE");
    if (q.quotedUnitPrice < 0 || Number.isNaN(q.quotedUnitPrice)) {
      throw new Error("INVALID_QUOTE_PRICE");
    }
  }

  const from = request.status;
  const to: WholesaleStatus = "quote_provided";
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    for (const q of input.lineQuotes) {
      await tx.wholesaleRequestLine.update({
        where: { id: q.lineId },
        data: {
          quotedUnitPrice: q.quotedUnitPrice,
          currency: currency,
        },
      });
    }

    return tx.wholesaleRequest.update({
      where: { id: request.id },
      data: {
        status: to,
        quoteMessage: input.quoteMessage?.trim() || null,
        quoteCurrency: currency,
        quotedAt: now,
        quotedByAdminId: input.actorAdminId,
        events: {
          create: {
            eventType: "quote_provided",
            fromStatus: from,
            toStatus: to,
            actorRole: "admin",
            actorAdminId: input.actorAdminId,
            note: input.quoteMessage?.trim() || null,
          },
        },
      },
      include: {
        lines: true,
        events: { orderBy: { createdAt: "asc" } },
        trader: true,
      },
    });
  });

  await notifyTrader({
    traderId: updated.traderId,
    domain: "wholesale",
    titleAr: `عرض سعر جملة · ${updated.reference}`,
    titleEn: `Wholesale quote · ${updated.reference}`,
    bodyAr: "وصلك عرض سعر من الإدارة — راجع وردّ.",
    bodyEn: "Admin sent a wholesale quote — review and respond.",
    href: `/trader/wholesale/${updated.id}`,
  });

  return updated;
}

export async function traderRespondToWholesaleQuote(input: {
  requestId: string;
  traderId: string;
  accept: boolean;
  note?: string;
  locale?: "ar" | "en";
}) {
  const request = await prisma.wholesaleRequest.findFirst({
    where: { id: input.requestId, traderId: input.traderId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (request.status !== "quote_provided") {
    throw new Error("RESPONSE_NOT_ALLOWED");
  }

  const to: WholesaleStatus = input.accept ? "confirmed" : "cancelled";
  const now = new Date();

  const updated = await prisma.wholesaleRequest.update({
    where: { id: request.id },
    data: {
      status: to,
      traderResponseNote: input.note?.trim() || null,
      confirmedAt: input.accept ? now : undefined,
      cancelledAt: input.accept ? undefined : now,
      events: {
        create: {
          eventType: input.accept ? "trader_accepted" : "trader_declined",
          fromStatus: request.status,
          toStatus: to,
          actorRole: "trader",
          actorTraderId: input.traderId,
          note: input.note?.trim() || null,
        },
      },
    },
    include: { lines: true, events: { orderBy: { createdAt: "asc" } } },
  });

  if (input.accept && updated.status === "confirmed") {
    await prepareWholesaleHandoffForRequest(updated.id, input.locale ?? "ar");
  }

  return updated;
}

export async function traderCancelWholesaleRequest(input: {
  requestId: string;
  traderId: string;
  note?: string;
}) {
  const request = await prisma.wholesaleRequest.findFirst({
    where: { id: input.requestId, traderId: input.traderId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!isWholesaleStatus(request.status)) throw new Error("INVALID_STATUS");
  if (request.status !== "submitted" && request.status !== "under_review") {
    throw new Error("CANCEL_NOT_ALLOWED");
  }
  if (!isOpenWholesaleStatus(request.status)) {
    throw new Error("CANCEL_NOT_ALLOWED");
  }

  const now = new Date();
  return prisma.wholesaleRequest.update({
    where: { id: request.id },
    data: {
      status: "cancelled",
      cancelledAt: now,
      events: {
        create: {
          eventType: "status_changed",
          fromStatus: request.status,
          toStatus: "cancelled",
          actorRole: "trader",
          actorTraderId: input.traderId,
          note: input.note?.trim() || "Cancelled by trader",
        },
      },
    },
  });
}

/** D37b / Appendix S 8.3 — admin sets carrier + tracking. */
export async function adminUpdateWholesaleShipping(input: {
  requestId: string;
  actorAdminId: string;
  carrier: string;
  trackingReference: string;
  shippedAt?: Date | null;
}) {
  const request = await prisma.wholesaleRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");

  const carrier = input.carrier.trim();
  const trackingReference = input.trackingReference.trim();
  if (!carrier || !trackingReference) {
    throw new Error("SHIPPING_FIELDS_REQUIRED");
  }

  const updated = await prisma.wholesaleRequest.update({
    where: { id: request.id },
    data: {
      carrier,
      trackingReference,
      shippedAt: input.shippedAt ?? new Date(),
      events: {
        create: {
          eventType: "status_changed",
          fromStatus: request.status,
          toStatus: request.status,
          actorRole: "admin",
          actorAdminId: input.actorAdminId,
          note: `Shipping: ${carrier} / ${trackingReference}`,
        },
      },
    },
    include: {
      lines: true,
      events: { orderBy: { createdAt: "asc" } },
      trader: true,
    },
  });

  await notifyTrader({
    traderId: updated.traderId,
    domain: "wholesale",
    titleAr: `تحديث شحن الجملة · ${updated.reference}`,
    titleEn: `Wholesale shipping update · ${updated.reference}`,
    bodyAr: `الناقل ${carrier} — رقم التتبع ${trackingReference}`,
    bodyEn: `Carrier ${carrier} — tracking ${trackingReference}`,
    href: `/trader/wholesale/${updated.id}`,
  });

  return updated;
}
