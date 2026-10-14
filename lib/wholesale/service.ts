import { uiVisibleWholesaleWhere } from "@/lib/admin/ui-hidden";
import { prisma } from "@/lib/db/prisma";
import {
  WHOLESALE_QTY_TECHNICAL_MAX,
  canTransitionWholesale,
  isOpenWholesaleStatus,
  isWholesaleRequestMode,
  isWholesaleStatus,
  type WholesaleRequestMode,
  type WholesaleStatus,
} from "@/lib/wholesale/constants";

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
    catalogRetailPriceSnapshot: number;
    catalogCurrencySnapshot: string;
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
      catalogRetailPriceSnapshot: Number(product.retailPrice),
      catalogCurrencySnapshot: product.currency,
    });
  }

  const reference = buildReference();
  const status: WholesaleStatus = "submitted";

  return prisma.wholesaleRequest.create({
    data: {
      reference,
      traderId: input.traderId,
      requestMode: input.requestMode,
      status,
      traderNotes: input.traderNotes?.trim() || "",
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
          note: `Mode: ${input.requestMode}`,
        },
      },
    },
    include: { lines: true },
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
  return prisma.wholesaleRequest.findMany({
    where: { AND: [{ traderId }, uiVisibleWholesaleWhere()] },
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

  return prisma.wholesaleRequest.update({
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

  return prisma.$transaction(async (tx) => {
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
}

export async function traderRespondToWholesaleQuote(input: {
  requestId: string;
  traderId: string;
  accept: boolean;
  note?: string;
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

  return prisma.wholesaleRequest.update({
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
