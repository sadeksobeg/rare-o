"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions";
import { handleAdminSessionError, requireAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { sendRetailCustomerMessage } from "@/lib/retail-request/customer-channel";
import { ensureOrderToken, orderPageUrl } from "@/lib/retail-request/order-page";
import { buildPaymentMessage, buildShipmentUpdateMessage, formatEta } from "@/lib/retail-request/shipment-text";
import { createShipment, postShipmentUpdate } from "@/lib/shipping/shipments";

function bump(requestId: string) {
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  revalidatePath("/admin/shipping/shipments");
}

/** Payment agreed with the customer: prepaid or cash on delivery (+ confirm receipt of an advance payment). */
export async function adminSetRetailPaymentAction(
  formData: FormData
): Promise<ActionResult & { data?: { notified: string } }> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const requestId = String(formData.get("requestId") || "");
  const mode = String(formData.get("mode") || "");
  const confirmed = String(formData.get("confirmed") || "") === "1";
  if (mode !== "prepaid" && mode !== "cod") return { ok: false, error: "VALIDATION" };
  const r = await prisma.retailRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      paymentConfirmedAt: true,
      paymentMode: true,
      reference: true,
      customerName: true,
      customerPhone: true,
      customerId: true,
      locale: true,
    },
  });
  if (!r) return { ok: false, error: "NOT_FOUND" };
  if (r.status === "completed" || r.status === "cancelled") return { ok: false, error: "REQUEST_CLOSED" };

  await prisma.$transaction([
    prisma.retailRequest.update({
      where: { id: r.id },
      data: {
        paymentMode: mode,
        paymentConfirmedAt: mode === "prepaid" && confirmed ? (r.paymentConfirmedAt ?? new Date()) : null,
      },
    }),
    prisma.retailHandoffEvent.create({
      data: {
        requestId: r.id,
        eventType: "payment_set",
        actor: "admin",
        actorAdminId: session.sub,
        note:
          mode === "cod"
            ? "الدفع عند الاستلام"
            : confirmed
              ? "دفع مسبق — تم استلام الدفعة"
              : "دفع مسبق — بانتظار استلام الدفعة",
      },
    }),
  ]);
  bump(r.id);

  let notified = "skipped";
  const changed = r.paymentMode !== mode || Boolean(r.paymentConfirmedAt) !== (mode === "prepaid" && confirmed);
  if (String(formData.get("notifyCustomer") || "") === "1" && changed) {
    const token = await ensureOrderToken(r.id);
    if (token) {
      const sent = await sendRetailCustomerMessage({
        request: r,
        adminId: session.sub,
        text: buildPaymentMessage({
          locale: r.locale === "en" ? "en" : "ar",
          name: r.customerName,
          reference: r.reference,
          mode,
          confirmed: mode === "prepaid" && confirmed,
          link: orderPageUrl(token),
        }),
      });
      notified = sent.ok ? "sent" : sent.error;
      if (sent.ok) {
        await prisma.retailHandoffEvent.create({
          data: {
            requestId: r.id,
            eventType: "status_notified",
            actor: "admin",
            actorAdminId: session.sub,
            note: "أُبلغ العميل بطريقة الدفع على واتساب",
          },
        });
      }
    }
  }
  return { ok: true, data: { notified } };
}

/** Turns the request into a Shipment (carrier, tracking, price) so it can be followed and updated. */
export async function adminSendRetailToShippingAction(formData: FormData): Promise<ActionResult> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const requestId = String(formData.get("requestId") || "");
  const r = await prisma.retailRequest.findUnique({
    where: { id: requestId },
    include: { shipments: { select: { id: true, status: true } } },
  });
  if (!r) return { ok: false, error: "NOT_FOUND" };
  if (r.status === "completed" || r.status === "cancelled") return { ok: false, error: "REQUEST_CLOSED" };
  if (r.shipments.some((s) => s.status !== "CANCELLED")) return { ok: false, error: "SHIPMENT_EXISTS" };
  if (!r.paymentMode) return { ok: false, error: "PAYMENT_REQUIRED" };
  if (r.paymentMode === "prepaid" && !r.paymentConfirmedAt) return { ok: false, error: "PAYMENT_NOT_CONFIRMED" };

  const price = Number(formData.get("priceCharged"));
  const res = await createShipment({
    parent: "retail",
    parentId: r.id,
    methodCode: r.shippingMethodCode ?? "",
    methodLabel: r.shippingMethodLabel ?? "",
    carrierLabel: String(formData.get("carrierLabel") || ""),
    destCountry: r.destinationCountry,
    destAddress: String(formData.get("destAddress") || ""),
    recipientName: r.customerName,
    recipientPhone: r.customerPhone,
    trackingNumber: String(formData.get("trackingNumber") || ""),
    priceCharged:
      Number.isFinite(price) && formData.get("priceCharged") !== ""
        ? price
        : r.shippingCostAmount != null
          ? Number(r.shippingCostAmount)
          : 0,
    currency: r.shippingCostCurrency ?? r.currency,
    actor: session.name || session.email || session.sub,
  });
  if (!res.ok) return { ok: false, error: res.error };
  await prisma.retailHandoffEvent.create({
    data: {
      requestId: r.id,
      eventType: "sent_to_shipping",
      actor: "admin",
      actorAdminId: session.sub,
      note: r.paymentMode === "cod" ? "أُرسل للشحن — الدفع عند الاستلام" : "أُرسل للشحن — مدفوع مسبقاً",
    },
  });
  bump(r.id);
  return { ok: true };
}

/** Status change and/or free note on the shipment, optionally told to the customer on WhatsApp. */
export async function adminPostRetailShipmentUpdateAction(
  formData: FormData
): Promise<ActionResult & { data?: { notified: string } }> {
  let session;
  try {
    session = await requireAdminSession();
  } catch (e) {
    return handleAdminSessionError(e, "UNAUTHORIZED");
  }
  const shipmentId = String(formData.get("shipmentId") || "");
  const to = String(formData.get("to") || "") || null;
  const note = String(formData.get("note") || "");
  const tracking = String(formData.get("trackingNumber") || "");
  const notify = String(formData.get("notifyCustomer") || "") === "1";

  const sh = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, retailRequestId: true },
  });
  if (!sh?.retailRequestId) return { ok: false, error: "NOT_FOUND" };

  const upd = await postShipmentUpdate({
    id: sh.id,
    to,
    note,
    trackingNumber: tracking,
    actor: session.name || session.email || session.sub,
  });
  if (!upd.ok) return { ok: false, error: upd.error };

  const req = await prisma.retailRequest.findUnique({
    where: { id: sh.retailRequestId },
    select: {
      id: true,
      reference: true,
      customerName: true,
      customerPhone: true,
      customerId: true,
      locale: true,
      etaMinDays: true,
      etaMaxDays: true,
    },
  });
  await prisma.retailHandoffEvent.create({
    data: {
      requestId: sh.retailRequestId,
      eventType: "shipment_update",
      actor: "admin",
      actorAdminId: session.sub,
      note: note || `الشحنة: ${upd.status}`,
    },
  });

  let notified = "skipped";
  if (notify && req) {
    const token = await ensureOrderToken(req.id);
    if (token) {
      const fresh = await prisma.shipment.findUnique({
        where: { id: sh.id },
        select: { trackingNumber: true },
      });
      const sent = await sendRetailCustomerMessage({
        request: req,
        adminId: session.sub,
        text: buildShipmentUpdateMessage({
          locale: req.locale === "en" ? "en" : "ar",
          name: req.customerName,
          reference: req.reference,
          status: upd.status,
          note: note || undefined,
          eta: formatEta(req.etaMinDays, req.etaMaxDays, req.locale !== "en"),
          tracking: fresh?.trackingNumber,
          link: orderPageUrl(token),
        }),
      });
      notified = sent.ok ? "sent" : sent.error;
      if (sent.ok) {
        await prisma.retailHandoffEvent.create({
          data: {
            requestId: req.id,
            eventType: "status_notified",
            actor: "admin",
            actorAdminId: session.sub,
            note: "أُرسل تحديث الشحنة للعميل عبر واتساب",
          },
        });
      }
    }
  }
  bump(sh.retailRequestId);
  return { ok: true, data: { notified } };
}
