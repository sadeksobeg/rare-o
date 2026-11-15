"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/actions";
import {
  handleAdminSessionError,
  requireAdminSession,
} from "@/lib/auth/admin-session";
import {
  handleTraderSessionError,
  requireTraderSession,
} from "@/lib/auth/trader-session";
import {
  adminIssueBrokerageInvoice,
  tellBrokerageTrader,
  traderClaimBrokeragePayment,
  adminRequestBrokeragePhotos,
  appendBrokerageRequestPhotos,
  traderSubmitBrokeragePhotos,
  adminTransitionBrokerage,
  confirmBrokeragePayment,
  createBrokerageRequest,
  markBrokerageHandoffOpened,
  setBrokerageRequestPhotos,
  traderTransitionBrokerage,
  upsertAndSendQuote,
  upsertInspection,
} from "@/lib/brokerage/service";
import {
  collectPhotoFiles,
  mediaErrorMessage,
  mergePhotoPaths,
  parsePhotoPaths,
  preflightPhotoFiles,
  saveBrokeragePhotos,
} from "@/lib/brokerage/media";
import { BROKERAGE_BATCH_MAX_PHOTOS } from "@/lib/brokerage/media-shared";
import type { BrokerageStatus } from "@/lib/brokerage/status";
import { prisma } from "@/lib/db/prisma";

const createSchema = z.object({
  descriptionAr: z.string().trim().min(8).max(2000),
  descriptionEn: z.string().trim().max(2000).optional(),
  modelNumber: z.string().trim().min(1).max(120),
  statedPriceUsd: z.coerce.number().int().positive().max(10_000_000),
  quantity: z.coerce.number().int().min(1).max(99).optional(),
  cityAr: z.string().trim().max(120).optional(),
  cityEn: z.string().trim().max(120).optional(),
  placeNameAr: z.string().trim().max(200).optional(),
  placeNameEn: z.string().trim().max(200).optional(),
  sellerContact: z.string().trim().max(200).optional(),
  sourceUrl: z.string().trim().max(500).optional(),
  budgetMinUsd: z.coerce.number().int().min(0).optional().nullable(),
  budgetMaxUsd: z.coerce.number().int().min(0).optional().nullable(),
  timelineNotes: z.string().trim().max(1000).optional(),
  traderNotes: z.string().trim().max(2000).optional(),
});

function revalidateBrokerage(id?: string) {
  revalidatePath("/admin/brokerage");
  revalidatePath("/trader/brokerage");
  revalidatePath("/admin");
  revalidatePath("/trader");
  if (id) {
    revalidatePath(`/admin/brokerage/${id}`);
    revalidatePath(`/trader/brokerage/${id}`);
  }
}

export async function traderCreateBrokerageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }
  const parsed = createSchema.safeParse({
    descriptionAr: formData.get("descriptionAr"),
    descriptionEn: formData.get("descriptionEn") || undefined,
    modelNumber: formData.get("modelNumber"),
    statedPriceUsd: formData.get("statedPriceUsd"),
    quantity: formData.get("quantity") || 1,
    cityAr: formData.get("cityAr") || undefined,
    cityEn: formData.get("cityEn") || undefined,
    placeNameAr: formData.get("placeNameAr") || undefined,
    placeNameEn: formData.get("placeNameEn") || undefined,
    sellerContact: formData.get("sellerContact") || undefined,
    sourceUrl: formData.get("sourceUrl") || undefined,
    budgetMinUsd: formData.get("budgetMinUsd") || null,
    budgetMaxUsd: formData.get("budgetMaxUsd") || null,
    timelineNotes: formData.get("timelineNotes") || undefined,
    traderNotes: formData.get("traderNotes") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }
  const files = collectPhotoFiles(formData);
  if (files.length > 6) return { ok: false, error: mediaErrorMessage("MAX", "ar") };
  const pre = preflightPhotoFiles(files, 0);
  if (!pre.ok) {
    return { ok: false, error: mediaErrorMessage(pre.error, "ar") };
  }
  const row = await createBrokerageRequest({
    traderId: session.sub,
    locale: "ar",
    ...parsed.data,
  });
  if (files.length > 0) {
    const saved = await saveBrokeragePhotos(row.id, files, 0);
    if (saved.ok && saved.paths.length > 0) {
      await setBrokerageRequestPhotos(row.id, saved.paths);
    }
  }
  revalidateBrokerage(row.id);
  return { ok: true, data: { id: row.id } };
}

export async function traderRespondQuoteAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "approve" && decision !== "reject")) {
    return { ok: false, error: "VALIDATION" };
  }
  try {
    await traderTransitionBrokerage({
      id,
      traderId: session.sub,
      toStatus: decision === "approve" ? "APPROVED" : "REJECTED",
      messageAr:
        decision === "approve" ? "وافق التاجر على العرض" : "رفض التاجر العرض",
      messageEn:
        decision === "approve" ? "Trader approved quote" : "Trader rejected quote",
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(id);
  return { ok: true };
}

export async function traderResubmitBrokerageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "VALIDATION" };
  const files = collectPhotoFiles(formData);
  try {
    if (files.length > 0) {
      const existing = await prisma.brokerageRequest.findFirst({
        where: { id, traderId: session.sub },
        select: { photoPaths: true },
      });
      if (!existing) return { ok: false, error: "NOT_FOUND" };
      const already = parsePhotoPaths(existing.photoPaths).length;
      const saved = await saveBrokeragePhotos(id, files, already);
      if (!saved.ok) {
        return { ok: false, error: mediaErrorMessage(saved.error, "ar") };
      }
      if (saved.paths.length > 0) {
        await appendBrokerageRequestPhotos({
          id,
          traderId: session.sub,
          paths: saved.paths,
        });
      }
    }
    await traderTransitionBrokerage({
      id,
      traderId: session.sub,
      toStatus: "SUBMITTED",
      messageAr: "أعاد التاجر التقديم بعد طلب معلومات",
      messageEn: "Trader resubmitted after needs-info",
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(id);
  return { ok: true };
}

export async function adminBrokerageTransitionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  const toStatus = String(formData.get("toStatus") ?? "") as BrokerageStatus;
  if (!id || !toStatus) return { ok: false, error: "VALIDATION" };
  try {
    await adminTransitionBrokerage({
      id,
      adminId: session.sub,
      toStatus,
      declineReason: String(formData.get("declineReason") ?? "") || undefined,
      inspectionAssignee:
        String(formData.get("inspectionAssignee") ?? "") || undefined,
      inspectionLocation:
        String(formData.get("inspectionLocation") ?? "") || undefined,
      inspectionAt: formData.get("inspectionAt")
        ? new Date(String(formData.get("inspectionAt")))
        : undefined,
      carrier: String(formData.get("carrier") ?? "") || undefined,
      trackingRef: String(formData.get("trackingRef") ?? "") || undefined,
      messageAr: String(formData.get("messageAr") ?? "") || undefined,
      messageEn: String(formData.get("messageEn") ?? "") || undefined,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(id);
  return { ok: true };
}

export async function adminSaveInspectionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return { ok: false, error: "VALIDATION" };
  const files = collectPhotoFiles(formData);
  try {
    let photoPaths: string[] | undefined;
    if (files.length > 0) {
      const existing = await prisma.brokerageInspection.findUnique({
        where: { requestId },
        select: { photoPaths: true },
      });
      const already = parsePhotoPaths(existing?.photoPaths).length;
      const saved = await saveBrokeragePhotos(requestId, files, already);
      if (!saved.ok) {
        return { ok: false, error: mediaErrorMessage(saved.error, "ar") };
      }
      photoPaths = mergePhotoPaths(existing?.photoPaths, saved.paths);
    }
    await upsertInspection({
      requestId,
      adminId: session.sub,
      grade: String(formData.get("grade") ?? "B"),
      notesAr: String(formData.get("notesAr") ?? ""),
      notesEn: String(formData.get("notesEn") ?? ""),
      verdictAr: String(formData.get("verdictAr") ?? ""),
      verdictEn: String(formData.get("verdictEn") ?? ""),
      checklist: String(formData.get("checklist") ?? ""),
      photoPaths,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(requestId);
  return { ok: true };
}

export async function adminSendQuoteAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const requestId = String(formData.get("requestId") ?? "");
  const goodsValueUsd = Number(formData.get("goodsValueUsd"));
  const commissionRate = Number(formData.get("commissionRate"));
  const shippingUsd = Number(formData.get("shippingUsd") ?? 0);
  if (!requestId || !Number.isFinite(goodsValueUsd)) {
    return { ok: false, error: "VALIDATION" };
  }
  try {
    await upsertAndSendQuote({
      requestId,
      goodsValueUsd: Math.round(goodsValueUsd),
      commissionRate,
      shippingUsd: Math.round(shippingUsd) || 0,
      notesAr: String(formData.get("notesAr") ?? ""),
      notesEn: String(formData.get("notesEn") ?? ""),
      validUntil: formData.get("validUntil")
        ? new Date(String(formData.get("validUntil")))
        : null,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(requestId);
  return { ok: true };
}

export async function adminConfirmBrokeragePaymentAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "VALIDATION" };
  try {
    await confirmBrokeragePayment({ id, adminId: session.sub });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(id);
  return { ok: true };
}

export async function traderOpenBrokerageHandoffAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "VALIDATION" };
  try {
    await markBrokerageHandoffOpened({ id, traderId: session.sub });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(id);
  return { ok: true };
}


/** Admin: ask the trader for specific photos (platform + WhatsApp message). */
export async function adminRequestBrokeragePhotosAction(
  formData: FormData
): Promise<ActionResult & { data?: { notified: string } }> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  try {
    const res = await adminRequestBrokeragePhotos({
      requestId: id,
      adminId: session.sub,
      note: String(formData.get("note") ?? ""),
    });
    const { composeMessage } = await import("@/lib/messaging/compose");
    const { notifyTraderChannels, traderPortalUrl } = await import("@/lib/trader/notify-channels");
    const tr = await prisma.traderAccount.findUnique({ where: { id: res.request.traderId }, select: { displayName: true } });
    const out = await notifyTraderChannels({
      traderId: res.request.traderId,
      adminId: session.sub,
      text: composeMessage({
        ar: true,
        name: tr?.displayName,
        headline: "نحتاج صوراً إضافية لطلبك",
        context: `طلب الوساطة رقم ${res.request.reference}`,
        note: res.photoRequest.note,
        linkLabel: "ارفع الصور من هنا:",
        link: traderPortalUrl(`/trader/brokerage/${id}`),
      }),
    });
    revalidateBrokerage(id);
    return { ok: true, data: { notified: `${out.platform ? "platform" : "noplatform"}:${out.whatsapp}` } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

/** Trader: send photos (for an open request, or extra ones on their own). */
export async function traderSubmitBrokeragePhotosAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "VALIDATION" };
  const files = collectPhotoFiles(formData).slice(0, BROKERAGE_BATCH_MAX_PHOTOS);
  if (files.length === 0) return { ok: false, error: "اختر صورة واحدة على الأقل" };
  try {
    const existing = await prisma.brokerageRequest.findFirst({
      where: { id, traderId: session.sub },
      select: { photoPaths: true },
    });
    if (!existing) return { ok: false, error: "NOT_FOUND" };
    const already = parsePhotoPaths(existing.photoPaths).length;
    const pre = preflightPhotoFiles(files, already);
    if (!pre.ok) return { ok: false, error: mediaErrorMessage(pre.error, "ar") };
    const saved = await saveBrokeragePhotos(id, files, already);
    if (!saved.ok) return { ok: false, error: mediaErrorMessage(saved.error, "ar") };
    await traderSubmitBrokeragePhotos({
      requestId: id,
      traderId: session.sub,
      photoRequestId: String(formData.get("photoRequestId") ?? "") || null,
      paths: saved.paths,
      note: String(formData.get("note") ?? ""),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(id);
  return { ok: true };
}


/** Admin: issue the invoice and drop its link into the trader chat (platform + WhatsApp) in one click. */
export async function adminSendBrokerageInvoiceAction(
  formData: FormData
): Promise<ActionResult & { data?: { notified: string; url: string } }> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  try {
    const inv = await adminIssueBrokerageInvoice({ requestId: id, adminId: session.sub });
    const { siteBaseUrl } = await import("@/lib/retail-request/order-page");
    const url = `${siteBaseUrl()}/brokerage-invoice/${inv.invoiceToken}`;
    const notified = await tellBrokerageTrader(
      { id: inv.id, reference: inv.reference, traderId: inv.traderId },
      session.sub,
      "فاتورة طلبك جاهزة",
      "بعد إتمام الدفع، اختر من صفحة الطلب: «أبلغ بالدفع» عبر المنصة أو عبر واتساب.",
      [],
      url,
      "عرض الفاتورة:"
    );
    revalidateBrokerage(id);
    return { ok: true, data: { notified, url } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
}

/** Trader: "I have paid" via the platform or WhatsApp. */
export async function traderClaimBrokeragePaymentAction(formData: FormData): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }
  const id = String(formData.get("id") ?? "");
  const via = String(formData.get("via") ?? "") === "whatsapp" ? "whatsapp" : "platform";
  try {
    await traderClaimBrokeragePayment({ requestId: id, traderId: session.sub, via });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  revalidateBrokerage(id);
  return { ok: true };
}
