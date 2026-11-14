"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions";
import { handleAdminSessionError, requireAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import {
  buildConfirmationMessage,
  ensureOrderToken,
  missingCustomerData,
  orderPageUrl,
} from "@/lib/retail-request/order-page";
import {
  findRetailCustomerConversation,
  sendRetailCustomerMessage,
} from "@/lib/retail-request/customer-channel";
import {
  FULL_NAME_MESSAGE,
  PHONE_MESSAGE,
  isFullName,
  isValidPhone,
  normalizePhoneDigits,
} from "@/lib/validation/customer-identity";

export type ConfirmationPrep = {
  message: string;
  orderUrl: string;
  /** wa.me link to the CUSTOMER's number with the message prefilled (fallback when no chat/connection). */
  customerWaLink: string;
  missing: string[];
  canSendFromInbox: boolean;
  inboxBlockedReason: "NO_CONVERSATION" | "BLOCKED" | null;
};

async function loadRequest(requestId: string) {
  return prisma.retailRequest.findUnique({
    where: { id: requestId },
    include: { lines: true },
  });
}

/** Builds the ready message (variables filled) + links. Nothing is sent. */
export async function adminPrepareRetailConfirmationAction(
  requestId: string
): Promise<ActionResult & { data?: ConfirmationPrep }> {
  try {
    await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const r = await loadRequest(requestId);
  if (!r) return { ok: false, error: "NOT_FOUND" };
  const token = await ensureOrderToken(r.id);
  if (!token) return { ok: false, error: "FAILED" };
  const locale = r.locale === "en" ? "en" : "ar";
  const link = orderPageUrl(token);
  const missing = missingCustomerData(r);
  const message = buildConfirmationMessage({
    locale,
    reference: r.reference,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    destinationCountry: r.destinationCountry,
    customerNotes: r.customerNotes,
    currency: r.currency,
    subtotal: Number(r.subtotal),
    shippingCostAmount: r.shippingCostAmount != null ? Number(r.shippingCostAmount) : null,
    shippingCostCurrency: r.shippingCostCurrency,
    shippingMethodLabel: r.shippingMethodLabel,
    lines: r.lines.map((l) => ({
      name: locale === "en" ? l.productNameEn || l.productNameAr : l.productNameAr,
      quantity: l.quantity,
      lineTotal: Number(l.lineTotal),
    })),
    link,
    missing,
  });
  const chat = await findRetailCustomerConversation(r);
  const digits = normalizePhoneDigits(r.customerPhone);
  return {
    ok: true,
    data: {
      message,
      orderUrl: link,
      customerWaLink: `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
      missing,
      canSendFromInbox: !!chat && !chat.blocked,
      inboxBlockedReason: !chat ? "NO_CONVERSATION" : chat.blocked ? "BLOCKED" : null,
    },
  };
}

/** Admin sends the (possibly edited) message to the customer through the inbox. */
export async function adminSendRetailConfirmationAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const requestId = String(formData.get("requestId") || "");
  const text = String(formData.get("text") || "").trim();
  if (!requestId || text.length < 10) return { ok: false, error: "VALIDATION" };
  const r = await prisma.retailRequest.findUnique({
    where: { id: requestId },
    select: { id: true, customerId: true, customerPhone: true },
  });
  if (!r) return { ok: false, error: "NOT_FOUND" };

  const res = await sendRetailCustomerMessage({ request: r, text, adminId: session.sub });
  if (!res.ok) return { ok: false, error: res.error };
  await prisma.retailHandoffEvent.create({
    data: {
      requestId,
      eventType: "confirmation_sent",
      actor: "admin",
      actorAdminId: session.sub,
      note: "أُرسلت رسالة تأكيد البيانات عبر واتساب",
    },
  });
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/admin/inbox/${res.conversationId}`);
  return { ok: true };
}

/** Admin opened wa.me to the customer instead (no inbox chat) — keep the trail. */
export async function adminLogRetailConfirmationOpenedAction(
  requestId: string
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  await prisma.retailHandoffEvent.create({
    data: {
      requestId,
      eventType: "confirmation_opened",
      actor: "admin",
      actorAdminId: session.sub,
      note: "فُتحت رسالة التأكيد في واتساب",
    },
  });
  revalidatePath(`/admin/requests/${requestId}`);
  return { ok: true };
}

/** Admin corrects customer data (after a «changes requested» or a missing/invalid field). */
export async function adminUpdateRetailCustomerDataAction(
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const requestId = String(formData.get("requestId") || "");
  const name = String(formData.get("customerName") || "").trim().slice(0, 120);
  const phone = String(formData.get("customerPhone") || "").trim().slice(0, 40);
  const destination = String(formData.get("destinationCountry") || "").trim().slice(0, 80);
  const notes = String(formData.get("customerNotes") || "").trim().slice(0, 2000);
  const r = await prisma.retailRequest.findUnique({ where: { id: requestId } });
  if (!r) return { ok: false, error: "NOT_FOUND" };
  if (r.status === "completed" || r.status === "cancelled") {
    return { ok: false, error: "REQUEST_CLOSED" };
  }
  const ar = r.locale !== "en";
  if (!isFullName(name)) return { ok: false, error: (ar ? FULL_NAME_MESSAGE.ar : FULL_NAME_MESSAGE.en) };
  if (!isValidPhone(phone)) return { ok: false, error: (ar ? PHONE_MESSAGE.ar : PHONE_MESSAGE.en) };
  if (destination.length < 2) return { ok: false, error: ar ? "الوجهة مطلوبة" : "Destination is required" };

  const changed: string[] = [];
  if (name !== r.customerName) changed.push("الاسم");
  if (phone !== r.customerPhone) changed.push("الهاتف");
  if (destination !== r.destinationCountry) changed.push("الوجهة");
  if (notes !== r.customerNotes) changed.push("الملاحظات");
  if (changed.length === 0) return { ok: true };

  await prisma.$transaction([
    prisma.retailRequest.update({
      where: { id: r.id },
      data: {
        customerName: name,
        customerPhone: phone,
        destinationCountry: destination,
        customerNotes: notes,
        // data changed → the old answer no longer applies; ask again
        customerResponse: null,
        customerResponseNote: null,
        customerRespondedAt: null,
      },
    }),
    ...(r.customerId
      ? [
          prisma.customer.update({
            where: { id: r.customerId },
            data: { name, phone },
          }),
        ]
      : []),
    prisma.retailHandoffEvent.create({
      data: {
        requestId: r.id,
        eventType: "edited",
        actor: "admin",
        actorAdminId: session.sub,
        note: `عُدّلت بيانات العميل: ${changed.join("، ")}`,
      },
    }),
  ]);
  revalidatePath(`/admin/requests/${r.id}`);
  revalidatePath("/admin/requests");
  return { ok: true };
}
