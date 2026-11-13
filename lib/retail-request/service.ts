import { prisma } from "@/lib/db/prisma";
import type { RetailRequestCreateInput } from "@/lib/validation/schemas";
import {
  buildQuoteSnapshot,
  quote,
} from "@/lib/shipping/engine";
import {
  assertNoWhatsAppBusinessApiSend,
  prepareWhatsAppHandoff,
} from "@/lib/whatsapp/handoff-adapter";
import type { Prisma, Product } from "@prisma/client";
import {
  canTransitionRetailRequest,
  isRetailRequestStatus,
  type RetailRequestStatus,
} from "@/lib/retail-request/constants";
import type { HandoffPayload } from "@/lib/retail-request/types";

export type { HandoffPayload } from "@/lib/retail-request/types";

function buildReference(now = new Date()): string {
  const y = now.getUTCFullYear();
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `RO-${y}-${n}`;
}

function parsePayload(json: string): HandoffPayload {
  return JSON.parse(json) as HandoffPayload;
}

export async function createRetailRequestFromCart(
  input: RetailRequestCreateInput
) {
  assertNoWhatsAppBusinessApiSend();

  // Idempotent re-submit: same key returns the originally created request
  if (input.idempotencyKey) {
    const existing = await prisma.retailRequest.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { lines: true },
    });
    if (existing) {
      return {
        request: existing,
        handoffPayload: parsePayload(existing.handoffPayloadJson),
      };
    }
  }

  const productIds = input.lines.map((l) => l.productId);
  const products: Product[] = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const resolvedLines: Array<{
    productId: string;
    productNameAr: string;
    productNameEn: string;
    quantity: number;
    unitPriceSnapshot: number;
    lineTotal: number;
    currency: string;
  }> = [];

  for (const line of input.lines) {
    const product = byId.get(line.productId);
    if (!product) throw new Error("INVALID_PRODUCT");
    if (product.status !== "published") throw new Error("PRODUCT_NOT_PUBLISHED");
    if (product.availability !== "available") {
      throw new Error("PRODUCT_UNAVAILABLE");
    }
    if (product.retailPrice == null || !product.currency) {
      throw new Error("PRODUCT_PRICE_ON_REQUEST");
    }
    const unit = Number(product.retailPrice);
    resolvedLines.push({
      productId: product.id,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      quantity: line.quantity,
      unitPriceSnapshot: unit,
      lineTotal: unit * line.quantity,
      currency: product.currency,
    });
  }

  const currencies = new Set(resolvedLines.map((l) => l.currency));
  if (currencies.size !== 1) {
    throw new Error("MIXED_CURRENCY_CART");
  }
  const currency = resolvedLines[0].currency;
  const subtotal = resolvedLines.reduce((s, l) => s + l.lineTotal, 0);

  const quoteResult = input.destinationCode
    ? await quote({
        destinationCode: input.destinationCode,
        items: resolvedLines.map((l) => ({
          productId: l.productId,
          qty: l.quantity,
        })),
        declaredValue: subtotal,
        audience: "CUSTOMER",
      })
    : null;
  const shippingWeightKg = quoteResult?.weightKg ?? null;
  let shippingMethodCode: string | null = null;
  let shippingMethodLabel: string | null = null;
  let shippingCostAmount: number | null = null;
  let shippingCostCurrency: string | null = null;
  let shippingQuoteSnapshot: Prisma.InputJsonValue | undefined;

  if (input.shippingMethodCode) {
    const match = quoteResult?.methods.find(
      (m) => m.methodCode === input.shippingMethodCode
    );
    if (!match) {
      throw new Error("SHIPPING_METHOD_NOT_AVAILABLE");
    }
    shippingMethodCode = match.methodCode;
    shippingMethodLabel =
      input.locale === "ar" ? match.labelAr : match.labelEn;
    shippingCostAmount = match.price.total;
    shippingCostCurrency = match.price.currency;
    shippingQuoteSnapshot = buildQuoteSnapshot(
      quoteResult!,
      shippingMethodCode
    ) as Prisma.InputJsonValue;
  } else if (quoteResult) {
    shippingQuoteSnapshot = buildQuoteSnapshot(
      quoteResult,
      null
    ) as Prisma.InputJsonValue;
  }

  const customer = await prisma.customer.create({
    data: {
      name: input.customerName,
      phone: input.customerPhone,
      notes: input.customerNotes || null,
    },
  });

  const status = input.status as RetailRequestStatus;
  const createdAt = new Date();

  // buildReference() draws from only 9000 values per year (RO-YYYY-1000..9999),
  // so a random collision is a real, if infrequent, production possibility —
  // not just a test artifact. Retry with a fresh reference on that specific
  // unique-constraint violation instead of failing the customer's submission.
  const MAX_REFERENCE_ATTEMPTS = 8;
  let request:
    | Prisma.RetailRequestGetPayload<{ include: { lines: true } }>
    | undefined;

  for (let attempt = 1; attempt <= MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    const reference = buildReference();

    const handoffPayload: HandoffPayload = {
      reference,
      locale: input.locale,
      status,
      lines: resolvedLines.map((l) => ({
        productId: l.productId,
        nameAr: l.productNameAr,
        nameEn: l.productNameEn,
        qty: l.quantity,
        unitPriceSnapshot: l.unitPriceSnapshot,
        lineTotal: l.lineTotal,
        currency: l.currency,
      })),
      subtotal,
      currency,
      customer: {
        name: input.customerName,
        phone: input.customerPhone,
        notes: input.customerNotes || "",
      },
      destinationCountry: input.destinationCountry,
      destinationCode: input.destinationCode ?? null,
      shippingMethodCode,
      shippingMethodLabel,
      shippingCharge:
        shippingCostAmount != null && shippingCostCurrency != null
          ? { amount: shippingCostAmount, currency: shippingCostCurrency }
          : null,
      packagingCharge: null,
      createdAt: createdAt.toISOString(),
    };

    let handoffMessageText: string | null = null;
    let whatsAppDeepLink: string | null = null;
    let handoffPreparedAt: Date | null = null;

    if (status === "ready_for_handoff") {
      const prepared = prepareWhatsAppHandoff(handoffPayload);
      handoffMessageText = prepared.messageText;
      whatsAppDeepLink = prepared.deepLink;
      handoffPreparedAt = createdAt;
    }

    try {
      request = await prisma.retailRequest.create({
        data: {
          reference,
          locale: input.locale,
          status,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerNotes: input.customerNotes || "",
          destinationCountry: input.destinationCountry,
          destinationCode: input.destinationCode ?? null,
          shippingMethodCode,
          shippingMethodLabel,
          shippingCostAmount,
          shippingCostCurrency,
          shippingWeightKg,
          shippingQuoteSnapshot,
          whatsappShippingOptIn: Boolean(input.whatsappShippingOptIn),
          subtotal,
          currency,
          handoffPayloadJson: JSON.stringify(handoffPayload),
          handoffMessageText,
          whatsAppDeepLink,
          handoffPreparedAt,
          idempotencyKey: input.idempotencyKey ?? null,
          customerId: customer.id,
          lines: {
            create: resolvedLines.map((l) => ({
              productId: l.productId,
              productNameAr: l.productNameAr,
              productNameEn: l.productNameEn,
              quantity: l.quantity,
              unitPriceSnapshot: l.unitPriceSnapshot,
              lineTotal: l.lineTotal,
              currency: l.currency,
            })),
          },
          handoffEvents:
            status === "ready_for_handoff"
              ? {
                  create: {
                    eventType: "prepared",
                    fromStatus: null,
                    toStatus: status,
                    actor: "customer",
                    note: "Initial handoff prepared from storefront",
                  },
                }
              : undefined,
        },
        include: { lines: true },
      });
      break;
    } catch (e) {
      const isUniqueViolation =
        typeof e === "object" &&
        e !== null &&
        (e as { code?: string }).code === "P2002";
      const target = (e as { meta?: { target?: unknown } })?.meta?.target;
      const targetsReference =
        Array.isArray(target) && target.includes("reference");

      // Concurrent duplicate submit lost the idempotency-key race: return
      // the winner instead of erroring the retrying client.
      if (input.idempotencyKey && isUniqueViolation && !targetsReference) {
        const winner = await prisma.retailRequest.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { lines: true },
        });
        if (winner) {
          await prisma.customer
            .delete({ where: { id: customer.id } })
            .catch(() => {});
          request = winner;
          break;
        }
      }

      if (isUniqueViolation && targetsReference && attempt < MAX_REFERENCE_ATTEMPTS) {
        continue; // draw a new reference and retry
      }
      await prisma.customer
        .delete({ where: { id: customer.id } })
        .catch(() => {});
      throw e;
    }
  }

  if (!request) {
    // Unreachable in practice (the loop always either returns or throws),
    // but keeps this function's return type honest for TypeScript.
    throw new Error("RETAIL_REQUEST_CREATE_FAILED");
  }

  if (input.shippingInquiry) {
    await prisma.shippingInquiry.create({
      data: {
        destination: input.destinationCountry,
        countryCode: input.destinationCode ?? null,
        contactName: input.customerName,
        contactPhone: input.customerPhone,
        notes: input.customerNotes || "",
        audience: "CUSTOMER",
        status: "NEW",
        itemsJson: resolvedLines.map((l) => ({
          productId: l.productId,
          qty: l.quantity,
          reference: request.reference,
        })),
      },
    });
  }

  return { request, handoffPayload: parsePayload(request.handoffPayloadJson) };
}

export async function markRetailHandoffOpened(input: {
  requestId: string;
  actor: "customer" | "admin";
  actorAdminId?: string | null;
}) {
  const request = await prisma.retailRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!isRetailRequestStatus(request.status)) {
    throw new Error("INVALID_STATUS");
  }

  const from = request.status;
  const now = new Date();

  // Opening again on a non-terminal request is allowed (retrigger path).
  // Status only advances when currently ready_for_handoff.
  let to: RetailRequestStatus = from;
  if (from === "ready_for_handoff") {
    to = "handoff_opened";
  } else if (from === "completed" || from === "cancelled") {
    throw new Error("HANDOFF_OPEN_NOT_ALLOWED");
  } else if (
    from !== "handoff_opened" &&
    from !== "in_follow_up" &&
    from !== "draft"
  ) {
    throw new Error("HANDOFF_OPEN_NOT_ALLOWED");
  }

  if (from === "draft") {
    throw new Error("HANDOFF_NOT_PREPARED");
  }

  const updated = await prisma.retailRequest.update({
    where: { id: request.id },
    data: {
      status: to,
      handoffOpenedAt: request.handoffOpenedAt ?? now,
      handoffEvents: {
        create: {
          eventType: "opened",
          fromStatus: from,
          toStatus: to,
          actor: input.actor,
          actorAdminId: input.actorAdminId ?? null,
          note:
            from === to
              ? "Handoff deep link opened again (same request)"
              : "Handoff deep link opened",
        },
      },
    },
  });

  return updated;
}

export async function transitionRetailRequestStatus(input: {
  requestId: string;
  toStatus: RetailRequestStatus;
  actorAdminId: string;
  note?: string;
}) {
  const request = await prisma.retailRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!isRetailRequestStatus(request.status)) {
    throw new Error("INVALID_STATUS");
  }

  const from = request.status;
  if (!canTransitionRetailRequest(from, input.toStatus)) {
    throw new Error("INVALID_TRANSITION");
  }

  return prisma.retailRequest.update({
    where: { id: request.id },
    data: {
      status: input.toStatus,
      handoffEvents: {
        create: {
          eventType: "status_changed",
          fromStatus: from,
          toStatus: input.toStatus,
          actor: "admin",
          actorAdminId: input.actorAdminId,
          note: input.note ?? null,
        },
      },
    },
  });
}

/**
 * Regenerate stored message + wa.me link on the same RetailRequest.
 * Does not create a duplicate request.
 */
export async function retriggerRetailHandoff(input: {
  requestId: string;
  actorAdminId: string;
}) {
  assertNoWhatsAppBusinessApiSend();

  const request = await prisma.retailRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!isRetailRequestStatus(request.status)) {
    throw new Error("INVALID_STATUS");
  }
  if (request.status === "completed" || request.status === "cancelled") {
    throw new Error("HANDOFF_RETRIGGER_NOT_ALLOWED");
  }
  if (request.status === "draft") {
    throw new Error("HANDOFF_NOT_PREPARED");
  }

  const payload = parsePayload(request.handoffPayloadJson);
  payload.status = request.status;
  const prepared = prepareWhatsAppHandoff(payload);
  const now = new Date();

  return prisma.retailRequest.update({
    where: { id: request.id },
    data: {
      handoffPayloadJson: JSON.stringify(payload),
      handoffMessageText: prepared.messageText,
      whatsAppDeepLink: prepared.deepLink,
      handoffPreparedAt: now,
      handoffEvents: {
        create: {
          eventType: "retriggered",
          fromStatus: request.status,
          toStatus: request.status,
          actor: "admin",
          actorAdminId: input.actorAdminId,
          note: "Handoff message/deep link regenerated (same request)",
        },
      },
    },
  });
}

export async function getDashboardCounts() {
  const [
    published,
    draft,
    unavailable,
    requests,
    draftRequests,
    readyRequests,
    handoffOpenedRequests,
    inFollowUpRequests,
    recentRequests,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "published" } }),
    prisma.product.count({ where: { status: "draft" } }),
    prisma.product.count({ where: { availability: "unavailable" } }),
    prisma.retailRequest.count(),
    prisma.retailRequest.count({ where: { status: "draft" } }),
    prisma.retailRequest.count({ where: { status: "ready_for_handoff" } }),
    prisma.retailRequest.count({ where: { status: "handoff_opened" } }),
    prisma.retailRequest.count({ where: { status: "in_follow_up" } }),
    prisma.retailRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        reference: true,
        status: true,
        customerName: true,
        createdAt: true,
        subtotal: true,
        currency: true,
      },
    }),
  ]);

  return {
    published,
    draft,
    unavailable,
    requests,
    draftRequests,
    readyRequests,
    handoffOpenedRequests,
    inFollowUpRequests,
    recentRequests,
  };
}
