import { prisma } from "@/lib/db/prisma";
import {
  canAdminTransition,
  canTraderTransition,
  type BrokerageStatus,
} from "@/lib/brokerage/status";
import { notifyTrader } from "@/lib/trader/notifications";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";
import { randomBytes, randomInt } from "node:crypto";
import { composeMessage } from "@/lib/messaging/compose";
import { notifyTraderChannels, traderPortalUrl } from "@/lib/trader/notify-channels";

const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** BR-YYYY-XXXXXX - unguessable and collision-safe (the old 4-digit form could repeat). */
function ref() {
  const y = new Date().getFullYear();
  let code = "";
  for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `BR-${y}-${code}`;
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

/** Customer-facing wording per status (platform inbox + WhatsApp). */
const BROKERAGE_TRADER_COPY: Partial<Record<string, { headline: string; note?: string }>> = {
  NEEDS_INFO: { headline: "نحتاج معلومات إضافية لطلبك", note: "يرجى فتح الطلب وإكمال المطلوب." },
  ACCEPTED: { headline: "تم قبول طلبك للمعاينة", note: "سنحدد موعد المعاينة ونوافيك به." },
  INSPECTION_SCHEDULED: { headline: "تم تحديد موعد المعاينة" },
  INSPECTED: { headline: "اكتملت المعاينة — تقريرك جاهز", note: "افتح الطلب لتطلع على جدول المعاينة والصور والحكم النهائي." },
  PURCHASED: { headline: "تم شراء القطعة لصالحك", note: "الخطوة التالية: الدفع، وسنرسل لك الفاتورة." },
  AWAITING_PAYMENT: { headline: "بانتظار إتمام الدفع", note: "افتح الطلب لعرض الفاتورة وإبلاغنا بالدفع." },
  SHIPPED: { headline: "شُحنت قطعتك" },
  DELIVERED: { headline: "تم تسليم قطعتك", note: "نتمنى أن تسعدك." },
  CLOSED: { headline: "اكتمل طلب الوساطة", note: "شكراً لثقتك بـ RARE OUD." },
  DECLINED: { headline: "تعذّر قبول طلب الوساطة" },
  CANCELLED: { headline: "تم إلغاء الطلب" },
};

async function tellTrader(
  row: { id: string; reference: string; traderId: string },
  adminId: string,
  headline: string,
  note?: string,
  details?: (string | null)[],
  link = traderPortalUrl(`/trader/brokerage/${row.id}`),
  linkLabel = "تفاصيل الطلب:"
): Promise<string> {
  const tr = await prisma.traderAccount.findUnique({ where: { id: row.traderId }, select: { displayName: true } });
  const res = await notifyTraderChannels({
    traderId: row.traderId,
    adminId,
    text: composeMessage({
      ar: true,
      name: tr?.displayName,
      headline,
      context: `طلب الوساطة رقم ${row.reference}`,
      details,
      note,
      linkLabel,
      link,
    }),
  });
  return `${res.platform ? "platform" : "noplatform"}:${res.whatsapp}`;
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

  const row = await prisma.brokerageRequest.create({
    data: {
      reference,
      traderId: input.traderId,
      status: "SUBMITTED",
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
    },
  });
  await appendEvent({
    requestId: row.id,
    actor: "trader",
    toStatus: "SUBMITTED",
    messageAr: "تم تقديم الطلب — بانتظار مراجعة الإدارة",
    messageEn: "Request submitted - awaiting admin review",
  });
  void publishInboxEvent("conversation.updated", {
    kind: "brokerage_submitted",
    domain: "brokerage",
    requestId: row.id,
    title: row.reference,
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
  if (!row.invoiceIssuedAt) throw new Error("INVOICE_REQUIRED");
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
    messageAr: "تم تأكيد استلام الدفعة — نجهّز الشحن",
    messageEn: "Payment received - preparing shipping",
  });
  await notifyTrader({
    traderId: row.traderId,
    domain: "brokerage",
    titleAr: `تأكيد دفع الوساطة ${row.reference}`,
    titleEn: `Brokerage payment confirmed ${row.reference}`,
    bodyAr: "أكدت الإدارة استلام الدفعة. نجهّز الشحن الآن.",
    bodyEn: "Admin confirmed payment receipt. Remaining stages will continue.",
    href: `/trader/brokerage/${row.id}`,
  });
  await tellTrader(
    { id: row.id, reference: row.reference, traderId: row.traderId },
    input.adminId,
    "استلمنا دفعتك، شكراً لك",
    "نجهّز الآن شحن قطعتك وسنوافيك بالتفاصيل."
  );
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
    include: {
      quote: true,
      inspection: true,
      photoRequests: { where: { requestedBy: "admin", fulfilledAt: null }, select: { id: true } },
    },
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
      photoRequests: { select: { requestedBy: true, fulfilledAt: true } },
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
  adminId?: string;
}) {
  const row = await prisma.brokerageRequest.findUnique({
    where: { id: input.id },
    include: { inspection: { select: { id: true } } },
  });
  if (!row) throw new Error("NOT_FOUND");
  if (!canAdminTransition(row.status, input.toStatus)) {
    throw new Error("INVALID_TRANSITION");
  }
  // Each stage needs what precedes it.
  if (input.toStatus === "INSPECTED" && !row.inspection) throw new Error("INSPECTION_REPORT_REQUIRED");
  if (input.toStatus === "INSPECTION_SCHEDULED" && !(input.inspectionAt ?? row.inspectionAt)) {
    throw new Error("INSPECTION_DATE_REQUIRED");
  }
  if (input.toStatus === "SHIPPED") {
    if (!row.paymentConfirmedAt) throw new Error("PAYMENT_REQUIRED");
    if (!row.purchasedAt) throw new Error("PURCHASE_REQUIRED");
    if (!(input.carrier ?? row.carrier)?.trim()) throw new Error("CARRIER_REQUIRED");
  }
  if (input.toStatus === "ACCEPTED" && row.status === "PAYMENT_CONFIRMED" && row.purchasedAt) {
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
  if (input.toStatus === "PURCHASED") data.purchasedAt = new Date();
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

  if (input.toStatus === "AWAITING_PAYMENT") {
    // Payment is the last stage: prepare the WhatsApp payment message the trader can open.
    try {
      const { buildBrokeragePaymentHandoffMessage, preparePaymentHandoff } = await import("@/lib/whatsapp/payment-handoff");
      const tr = await prisma.traderAccount.findUnique({ where: { id: row.traderId }, select: { displayName: true, email: true } });
      const prepared = await preparePaymentHandoff(
        buildBrokeragePaymentHandoffMessage({
          locale: "ar",
          reference: row.reference,
          description: row.descriptionAr,
          modelNumber: row.modelNumber,
          statedPriceUsd: row.statedPriceUsd ?? 0,
          traderName: tr?.displayName || tr?.email || "",
        })
      );
      await prisma.brokerageRequest.update({
        where: { id: row.id },
        data: { handoffMessageText: prepared.messageText, whatsAppDeepLink: prepared.deepLink, handoffPreparedAt: new Date() },
      });
    } catch {
      /* business number not configured - the platform notice still works */
    }
  }

  await notifyTrader({
    traderId: row.traderId,
    domain: "brokerage",
    titleAr: `تحديث وساطة ${row.reference}`,
    titleEn: `Brokerage update ${row.reference}`,
    bodyAr: input.messageAr ?? "",
    bodyEn: input.messageEn ?? "",
    href: `/trader/brokerage/${row.id}`,
  });
  if (input.adminId) {
    const copy = BROKERAGE_TRADER_COPY[input.toStatus];
    if (copy) {
      const when = (input.inspectionAt ?? updated.inspectionAt)?.toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
      await tellTrader(
        { id: row.id, reference: row.reference, traderId: row.traderId },
        input.adminId,
        copy.headline,
        input.toStatus === "DECLINED" ? input.declineReason || undefined : copy.note,
        input.toStatus === "INSPECTION_SCHEDULED"
          ? [
              when ? `الموعد: ${when}` : null,
              (input.inspectionLocation ?? updated.inspectionLocation) ? `المكان: ${input.inspectionLocation ?? updated.inspectionLocation}` : null,
              (input.inspectionAssignee ?? updated.inspectionAssignee) ? `المعاين: ${input.inspectionAssignee ?? updated.inspectionAssignee}` : null,
            ]
          : input.toStatus === "SHIPPED"
            ? [
                updated.carrier ? `شركة الشحن: ${updated.carrier}` : null,
                updated.trackingRef ? `رقم التتبع: ${updated.trackingRef}` : null,
              ]
            : undefined
      );
    }
  }

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
  void publishInboxEvent("conversation.updated", {
    kind: input.toStatus === "CANCELLED" ? "brokerage_cancelled" : "brokerage_resubmitted",
    domain: "brokerage",
    requestId: row.id,
    title: row.reference,
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
  adminId?: string;
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
        adminId: input.adminId,
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


// ---------------------------------------------------------------------------
// Photo requests: the admin asks for specific photos; the trader can also send extras any time.
// ---------------------------------------------------------------------------

const PHOTO_STAGE_BLOCKED = ["DELIVERED", "CLOSED", "DECLINED", "REJECTED", "CANCELLED"];

export async function adminRequestBrokeragePhotos(input: {
  requestId: string;
  adminId: string;
  note: string;
}) {
  const row = await prisma.brokerageRequest.findUnique({ where: { id: input.requestId } });
  if (!row) throw new Error("NOT_FOUND");
  if (PHOTO_STAGE_BLOCKED.includes(row.status)) throw new Error("PHOTOS_NOT_ALLOWED");
  const note = input.note.trim().slice(0, 1000);
  if (note.length < 3) throw new Error("NOTE_REQUIRED");
  const pr = await prisma.brokeragePhotoRequest.create({
    data: { requestId: row.id, note, requestedBy: "admin", requestedByAdminId: input.adminId },
  });
  await appendEvent({
    requestId: row.id,
    actor: "admin",
    kind: "photos_requested",
    messageAr: `طلبت الإدارة صوراً: ${note}`,
    messageEn: `Admin requested photos: ${note}`,
  });
  await notifyTrader({
    traderId: row.traderId,
    domain: "brokerage",
    titleAr: `مطلوب صور لطلب الوساطة ${row.reference}`,
    titleEn: `Photos requested for brokerage ${row.reference}`,
    bodyAr: note,
    bodyEn: note,
    href: `/trader/brokerage/${row.id}`,
  });
  return { photoRequest: pr, request: { id: row.id, reference: row.reference, traderId: row.traderId } };
}

/** Trader sends photos - answering an open request (photoRequestId) or as an extra batch. */
export async function traderSubmitBrokeragePhotos(input: {
  requestId: string;
  traderId: string;
  photoRequestId?: string | null;
  paths: string[];
  note?: string;
}) {
  const row = await prisma.brokerageRequest.findFirst({
    where: { id: input.requestId, traderId: input.traderId },
  });
  if (!row) throw new Error("NOT_FOUND");
  if (PHOTO_STAGE_BLOCKED.includes(row.status)) throw new Error("PHOTOS_NOT_ALLOWED");
  if (input.paths.length === 0) throw new Error("NO_PHOTOS");
  const note = (input.note ?? "").trim().slice(0, 1000);

  let batchId: string;
  if (input.photoRequestId) {
    const pr = await prisma.brokeragePhotoRequest.findFirst({
      where: { id: input.photoRequestId, requestId: row.id },
    });
    if (!pr) throw new Error("NOT_FOUND");
    const merged = JSON.stringify([...JSON.parse(pr.photoPaths || "[]"), ...input.paths]);
    await prisma.brokeragePhotoRequest.update({
      where: { id: pr.id },
      data: { photoPaths: merged, traderNote: note || pr.traderNote, fulfilledAt: new Date() },
    });
    batchId = pr.id;
  } else {
    const pr = await prisma.brokeragePhotoRequest.create({
      data: {
        requestId: row.id,
        requestedBy: "trader",
        photoPaths: JSON.stringify(input.paths),
        traderNote: note,
        fulfilledAt: new Date(),
      },
    });
    batchId = pr.id;
  }
  const { mergePhotoPaths } = await import("@/lib/brokerage/media-shared");
  await setBrokerageRequestPhotos(row.id, mergePhotoPaths(row.photoPaths, input.paths));
  await appendEvent({
    requestId: row.id,
    actor: "trader",
    kind: "photos_received",
    messageAr: `أرسل التاجر ${input.paths.length} صورة${note ? `: ${note}` : ""}`,
    messageEn: `Trader sent ${input.paths.length} photo(s)${note ? `: ${note}` : ""}`,
  });
  void publishInboxEvent("conversation.updated", {
    kind: "brokerage_photos",
    domain: "brokerage",
    requestId: row.id,
    title: `${row.reference} (${input.paths.length})`,
  });
  return { batchId, request: { id: row.id, reference: row.reference } };
}

export async function listBrokeragePhotoRequests(requestId: string) {
  return prisma.brokeragePhotoRequest.findMany({
    where: { requestId },
    orderBy: { createdAt: "desc" },
  });
}


// ---------------------------------------------------------------------------
// Payment — the LAST stage: invoice → trader payment notice → admin confirms
// ---------------------------------------------------------------------------

/** Issues (once) the unguessable invoice link; requires the piece to be purchased. */
export async function adminIssueBrokerageInvoice(input: { requestId: string; adminId: string }) {
  const row = await prisma.brokerageRequest.findUnique({ where: { id: input.requestId } });
  if (!row) throw new Error("NOT_FOUND");
  if (row.status !== "AWAITING_PAYMENT") throw new Error("INVALID_TRANSITION");
  const token = row.invoiceToken ?? randomBytes(18).toString("base64url");
  const updated = await prisma.brokerageRequest.update({
    where: { id: row.id },
    data: { invoiceToken: token, invoiceIssuedAt: row.invoiceIssuedAt ?? new Date() },
  });
  await appendEvent({
    requestId: row.id,
    actor: "admin",
    kind: "invoice_sent",
    messageAr: "أُصدرت الفاتورة وأُرسلت للتاجر",
    messageEn: "Invoice issued and sent to the trader",
  });
  return updated;
}

/** Trader says the payment was sent (platform notice or via WhatsApp); admin confirms receipt. */
export async function traderClaimBrokeragePayment(input: {
  requestId: string;
  traderId: string;
  via: "platform" | "whatsapp";
}) {
  const row = await prisma.brokerageRequest.findFirst({ where: { id: input.requestId, traderId: input.traderId } });
  if (!row) throw new Error("NOT_FOUND");
  if (row.status !== "AWAITING_PAYMENT") throw new Error("INVALID_TRANSITION");
  if (row.paymentClaimedAt) return row;
  const updated = await prisma.brokerageRequest.update({
    where: { id: row.id },
    data: { paymentClaimedAt: new Date(), paymentClaimedVia: input.via },
  });
  await appendEvent({
    requestId: row.id,
    actor: "trader",
    kind: "payment_claimed",
    messageAr: `أبلغ التاجر بإتمام الدفع (${input.via === "whatsapp" ? "عبر واتساب" : "عبر المنصة"})`,
    messageEn: `Trader reported payment (${input.via})`,
  });
  void publishInboxEvent("conversation.updated", {
    kind: input.via === "whatsapp" ? "brokerage_paid_claim_wa" : "brokerage_paid_claim",
    domain: "brokerage",
    requestId: row.id,
    title: row.reference,
  });
  return updated;
}

export async function getBrokerageInvoiceByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
  return prisma.brokerageRequest.findUnique({
    where: { invoiceToken: token },
    include: { trader: { select: { displayName: true, companyName: true, phone: true } }, quote: true },
  });
}

export { tellTrader as tellBrokerageTrader };
