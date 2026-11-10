import { prisma } from "@/lib/db/prisma";
import {
  canAdminTransition,
  canTraderTransition,
  type BrokerageStatus,
} from "@/lib/brokerage/status";
import { notifyTrader } from "@/lib/trader/notifications";

function ref() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const y = new Date().getFullYear();
  return `BR-${y}-${n}`;
}

async function uniqueRef(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const reference = ref();
    const hit = await prisma.brokerageRequest.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!hit) return reference;
  }
  return `BR-${Date.now()}`;
}

async function appendEvent(input: {
  requestId: string;
  actor: "admin" | "trader" | "system";
  fromStatus?: string | null;
  toStatus?: string | null;
  messageAr?: string;
  messageEn?: string;
  kind?: string;
}) {
  await prisma.brokerageEvent.create({
    data: {
      requestId: input.requestId,
      actor: input.actor,
      kind: input.kind ?? "status_change",
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      messageAr: input.messageAr ?? "",
      messageEn: input.messageEn ?? "",
    },
  });
}

export async function createBrokerageRequest(input: {
  traderId: string;
  descriptionAr: string;
  descriptionEn?: string;
  /** @deprecated legacy — prefer modelNumber */
  categoryAr?: string;
  categoryEn?: string;
  modelNumber: string;
  statedPriceUsd: number;
  quantity?: number;
  cityAr?: string;
  cityEn?: string;
  placeNameAr?: string;
  placeNameEn?: string;
  sellerContact?: string;
  sourceUrl?: string;
  budgetMinUsd?: number | null;
  budgetMaxUsd?: number | null;
  timelineNotes?: string;
  traderNotes?: string;
  photoPaths?: string[];
  locale?: "ar" | "en";
}) {
  const modelNumber = input.modelNumber.trim();
  if (!modelNumber) throw new Error("MODEL_NUMBER_REQUIRED");
  if (
    !Number.isFinite(input.statedPriceUsd) ||
    input.statedPriceUsd <= 0 ||
    !Number.isInteger(input.statedPriceUsd)
  ) {
    throw new Error("STATED_PRICE_REQUIRED");
  }

  const trader = await prisma.traderAccount.findUnique({
    where: { id: input.traderId },
    select: { displayName: true, email: true },
  });
  if (!trader) throw new Error("TRADER_NOT_FOUND");

  const reference = await uniqueRef();
  const locale = input.locale ?? "ar";
  const descriptionAr = input.descriptionAr.trim();
  const descriptionEn = (input.descriptionEn ?? input.descriptionAr).trim();

  let handoffMessageText: string | null = null;
  let whatsAppDeepLink: string | null = null;
  let handoffPreparedAt: Date | null = null;
  try {
    const { buildBrokeragePaymentHandoffMessage, preparePaymentHandoff } =
      await import("@/lib/whatsapp/payment-handoff");
    const messageText = buildBrokeragePaymentHandoffMessage({
      locale,
      reference,
      description: locale === "ar" ? descriptionAr : descriptionEn || descriptionAr,
      modelNumber,
      statedPriceUsd: input.statedPriceUsd,
      traderName: trader.displayName || trader.email,
    });
    const prepared = preparePaymentHandoff(messageText);
    handoffMessageText = prepared.messageText;
    whatsAppDeepLink = prepared.deepLink;
    handoffPreparedAt = new Date();
  } catch {
    /* WHATSAPP_BUSINESS_E164 may be unset in some envs — status still AWAITING_PAYMENT */
  }

  const row = await prisma.brokerageRequest.create({
    data: {
      reference,
      traderId: input.traderId,
      status: "AWAITING_PAYMENT",
      descriptionAr,
      descriptionEn,
      categoryAr: input.categoryAr?.trim() ?? "",
      categoryEn: input.categoryEn?.trim() ?? "",
      modelNumber,
      statedPriceUsd: input.statedPriceUsd,
      quantity: Math.max(1, input.quantity ?? 1),
      cityAr: input.cityAr?.trim() ?? "",
      cityEn: input.cityEn?.trim() ?? "",
      placeNameAr: input.placeNameAr?.trim() ?? "",
      placeNameEn: input.placeNameEn?.trim() ?? "",
      sellerContact: input.sellerContact?.trim() ?? "",
      sourceUrl: input.sourceUrl?.trim() ?? "",
      budgetMinUsd: input.budgetMinUsd ?? null,
      budgetMaxUsd: input.budgetMaxUsd ?? null,
      timelineNotes: input.timelineNotes?.trim() ?? "",
      traderNotes: input.traderNotes?.trim() ?? "",
      photoPaths: JSON.stringify(input.photoPaths ?? []),
      handoffMessageText,
      whatsAppDeepLink,
      handoffPreparedAt,
    },
  });
  await appendEvent({
    requestId: row.id,
    actor: "trader",
    toStatus: "AWAITING_PAYMENT",
    messageAr: "تم تقديم الطلب — بانتظار الدفع عبر واتساب ثم تأكيد الإدارة",
    messageEn:
      "Request submitted — await WhatsApp payment then admin confirmation",
  });
  return row;
}

/** Admin confirms offline payment; unlocks remaining brokerage stages. */
export async function confirmBrokeragePayment(input: {
  id: string;
  adminId: string;
}) {
  const row = await prisma.brokerageRequest.findUnique({ where: { id: input.id } });
  if (!row) throw new Error("NOT_FOUND");
  if (row.status !== "AWAITING_PAYMENT") {
    throw new Error("INVALID_TRANSITION");
  }
  const updated = await prisma.brokerageRequest.update({
    where: { id: input.id },
    data: {
      status: "PAYMENT_CONFIRMED",
      paymentConfirmedAt: new Date(),
      paymentConfirmedByAdminId: input.adminId,
    },
  });
  await appendEvent({
    requestId: input.id,
    actor: "admin",
    fromStatus: "AWAITING_PAYMENT",
    toStatus: "PAYMENT_CONFIRMED",
    messageAr: "تم تأكيد نجاح الدفع — يمكن متابعة مراحل الوساطة",
    messageEn: "Payment confirmed — remaining brokerage stages unlocked",
  });
  await notifyTrader({
    traderId: row.traderId,
    domain: "brokerage",
    titleAr: `تأكيد دفع الوساطة ${row.reference}`,
    titleEn: `Brokerage payment confirmed ${row.reference}`,
    bodyAr: "أكدت الإدارة استلام الدفع. ستُتابع بقية المراحل.",
    bodyEn: "Admin confirmed payment receipt. Remaining stages will continue.",
    href: `/trader/brokerage/${row.id}`,
  });
  return updated;
}

export async function markBrokerageHandoffOpened(input: {
  id: string;
  traderId: string;
}) {
  const row = await prisma.brokerageRequest.findFirst({
    where: { id: input.id, traderId: input.traderId },
  });
  if (!row) throw new Error("NOT_FOUND");
  if (row.handoffOpenedAt) return row;
  return prisma.brokerageRequest.update({
    where: { id: input.id },
    data: { handoffOpenedAt: new Date() },
  });
}

export async function setBrokerageRequestPhotos(
  id: string,
  photoPaths: string[]
) {
  return prisma.brokerageRequest.update({
    where: { id },
    data: { photoPaths: JSON.stringify(photoPaths) },
  });
}

export async function appendBrokerageRequestPhotos(input: {
  id: string;
  traderId: string;
  paths: string[];
}) {
  const row = await prisma.brokerageRequest.findFirst({
    where: { id: input.id, traderId: input.traderId },
    select: { id: true, photoPaths: true },
  });
  if (!row) throw new Error("NOT_FOUND");
  const { mergePhotoPaths } = await import("@/lib/brokerage/media");
  return setBrokerageRequestPhotos(
    row.id,
    mergePhotoPaths(row.photoPaths, input.paths)
  );
}

export async function listTraderBrokerage(traderId: string) {
  return prisma.brokerageRequest.findMany({
    where: { traderId },
    orderBy: { createdAt: "desc" },
    include: { quote: true, inspection: true },
  });
}

export async function listAdminBrokerage(status?: string) {
  return prisma.brokerageRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "asc" },
    include: {
      trader: { select: { id: true, displayName: true, email: true } },
      quote: true,
      inspection: true,
    },
  });
}

export async function getBrokerageForTrader(id: string, traderId: string) {
  return prisma.brokerageRequest.findFirst({
    where: { id, traderId },
    include: {
      quote: true,
      inspection: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getBrokerageForAdmin(id: string) {
  return prisma.brokerageRequest.findUnique({
    where: { id },
    include: {
      trader: true,
      quote: true,
      inspection: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function adminTransitionBrokerage(input: {
  id: string;
  toStatus: BrokerageStatus;
  messageAr?: string;
  messageEn?: string;
  declineReason?: string;
  inspectionAt?: Date | null;
  inspectionAssignee?: string;
  inspectionLocation?: string;
  carrier?: string;
  trackingRef?: string;
}) {
  const row = await prisma.brokerageRequest.findUnique({ where: { id: input.id } });
  if (!row) throw new Error("NOT_FOUND");
  if (!canAdminTransition(row.status, input.toStatus)) {
    throw new Error("INVALID_TRANSITION");
  }
  const data: Record<string, unknown> = { status: input.toStatus };
  if (input.declineReason) data.adminDeclineReason = input.declineReason;
  if (input.inspectionAt !== undefined) data.inspectionAt = input.inspectionAt;
  if (input.inspectionAssignee !== undefined)
    data.inspectionAssignee = input.inspectionAssignee;
  if (input.inspectionLocation !== undefined)
    data.inspectionLocation = input.inspectionLocation;
  if (input.carrier !== undefined) data.carrier = input.carrier;
  if (input.trackingRef !== undefined) data.trackingRef = input.trackingRef;
  if (input.toStatus === "SHIPPED") data.shippedAt = new Date();
  if (input.toStatus === "DELIVERED") data.deliveredAt = new Date();

  const updated = await prisma.brokerageRequest.update({
    where: { id: input.id },
    data,
  });
  await appendEvent({
    requestId: input.id,
    actor: "admin",
    fromStatus: row.status,
    toStatus: input.toStatus,
    messageAr: input.messageAr ?? `الحالة → ${input.toStatus}`,
    messageEn: input.messageEn ?? `Status → ${input.toStatus}`,
  });

  await notifyTrader({
    traderId: row.traderId,
    domain: "brokerage",
    titleAr: `تحديث وساطة ${row.reference}`,
    titleEn: `Brokerage update ${row.reference}`,
    bodyAr: input.messageAr ?? "",
    bodyEn: input.messageEn ?? "",
    href: `/trader/brokerage/${row.id}`,
  });

  return updated;
}

export async function traderTransitionBrokerage(input: {
  id: string;
  traderId: string;
  toStatus: BrokerageStatus;
  messageAr?: string;
  messageEn?: string;
}) {
  const row = await prisma.brokerageRequest.findFirst({
    where: { id: input.id, traderId: input.traderId },
  });
  if (!row) throw new Error("NOT_FOUND");
  if (!canTraderTransition(row.status, input.toStatus)) {
    throw new Error("INVALID_TRANSITION");
  }
  const updated = await prisma.brokerageRequest.update({
    where: { id: input.id },
    data: { status: input.toStatus },
  });
  await appendEvent({
    requestId: input.id,
    actor: "trader",
    fromStatus: row.status,
    toStatus: input.toStatus,
    messageAr: input.messageAr ?? "",
    messageEn: input.messageEn ?? "",
  });
  return updated;
}

export async function upsertInspection(input: {
  requestId: string;
  grade: string;
  notesAr: string;
  notesEn?: string;
  verdictAr: string;
  verdictEn?: string;
  photoPaths?: string[];
  checklist?: string;
}) {
  const row = await prisma.brokerageRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!row) throw new Error("NOT_FOUND");
  const inspection = await prisma.brokerageInspection.upsert({
    where: { requestId: input.requestId },
    create: {
      requestId: input.requestId,
      grade: input.grade,
      notesAr: input.notesAr,
      notesEn: input.notesEn ?? input.notesAr,
      verdictAr: input.verdictAr,
      verdictEn: input.verdictEn ?? input.verdictAr,
      photoPaths: JSON.stringify(input.photoPaths ?? []),
      checklist: input.checklist ?? "",
    },
    update: {
      grade: input.grade,
      notesAr: input.notesAr,
      notesEn: input.notesEn ?? input.notesAr,
      verdictAr: input.verdictAr,
      verdictEn: input.verdictEn ?? input.verdictAr,
      checklist: input.checklist ?? "",
      ...(input.photoPaths !== undefined
        ? { photoPaths: JSON.stringify(input.photoPaths) }
        : {}),
    },
  });
  if (canAdminTransition(row.status, "INSPECTED") || row.status === "INSPECTED") {
    if (row.status !== "INSPECTED" && canAdminTransition(row.status, "INSPECTED")) {
      await adminTransitionBrokerage({
        id: input.requestId,
        toStatus: "INSPECTED",
        messageAr: "تم حفظ تقرير المعاينة",
        messageEn: "Inspection report saved",
      });
    }
  }
  return inspection;
}

export async function upsertAndSendQuote(input: {
  requestId: string;
  goodsValueUsd: number;
  commissionRate: number;
  shippingUsd: number;
  notesAr?: string;
  notesEn?: string;
  validUntil?: Date | null;
}) {
  if (input.commissionRate < 1 || input.commissionRate > 2) {
    throw new Error("INVALID_COMMISSION");
  }
  const row = await prisma.brokerageRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!row) throw new Error("NOT_FOUND");

  await prisma.brokerageQuote.upsert({
    where: { requestId: input.requestId },
    create: {
      requestId: input.requestId,
      goodsValueUsd: input.goodsValueUsd,
      commissionRate: input.commissionRate,
      shippingUsd: input.shippingUsd,
      notesAr: input.notesAr ?? "",
      notesEn: input.notesEn ?? "",
      validUntil: input.validUntil ?? null,
    },
    update: {
      goodsValueUsd: input.goodsValueUsd,
      commissionRate: input.commissionRate,
      shippingUsd: input.shippingUsd,
      notesAr: input.notesAr ?? "",
      notesEn: input.notesEn ?? "",
      validUntil: input.validUntil ?? null,
    },
  });

  /* Legacy path only: quote no longer gates new payment-first requests. */
  if (row.status === "INSPECTED" && canAdminTransition(row.status, "QUOTE_SENT")) {
    await adminTransitionBrokerage({
      id: input.requestId,
      toStatus: "QUOTE_SENT",
      messageAr: "أُرسل عرض السعر (مسار قديم)",
      messageEn: "Quote sent (legacy path)",
    });
  }
}

/**
 * "Active" = not in a terminal state. Kept in sync with the same
 * CLOSED/DECLINED/REJECTED/CANCELLED exclusion list the admin brokerage
 * list page (`/admin/brokerage?status=active`) uses for its own "active"
 * count and filter, so the dashboard KPI and the page it links to agree.
 */
const BROKERAGE_TERMINAL_STATUSES = [
  "CLOSED",
  "DECLINED",
  "REJECTED",
  "CANCELLED",
] as const;

export async function countActiveBrokerage() {
  return prisma.brokerageRequest.count({
    where: {
      status: { notIn: [...BROKERAGE_TERMINAL_STATUSES] },
    },
  });
}
