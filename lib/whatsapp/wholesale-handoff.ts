/**
 * Wholesale → WhatsApp handoff. Deep-link only — does not send via Baileys
 * or the WhatsApp Business API. Built once a WholesaleRequest reaches
 * "confirmed" (trader accepted an admin quote, or admin confirmed a
 * propose_price request): this is the final price-settled point, matching
 * how deals/brokerage hand off after their own "accept" step.
 */
import { resolveBusinessE164 } from "@/lib/whatsapp/business-number";
import {
  buildWhatsAppDeepLink,
  getWhatsAppBusinessE164,
} from "@/lib/whatsapp/handoff-adapter";

export type WholesaleHandoffResult = {
  businessE164: string;
  messageText: string;
  deepLink: string;
};

export type WholesaleHandoffLine = {
  nameAr: string;
  nameEn: string;
  quantity: number;
  /** Settled unit price — quotedUnitPrice if admin quoted, else the
   * trader's own proposedUnitPrice (propose_price mode). */
  unitPrice: number | null;
  currency: string | null;
};

export type WholesaleHandoffPayload = {
  locale: "ar" | "en";
  reference: string;
  requestMode: "request_quote" | "propose_price";
  traderName: string;
  traderCompany: string;
  traderPhone: string;
  lines: WholesaleHandoffLine[];
  quoteMessage: string | null;
  destinationCountry: string | null;
  shippingMethodLabel: string | null;
  shippingCost: { amount: number; currency: string } | null;
  traderNotes: string;
};

function lineText(locale: "ar" | "en", l: WholesaleHandoffLine): string {
  const name = locale === "ar" ? l.nameAr || l.nameEn : l.nameEn || l.nameAr;
  const price =
    l.unitPrice != null && l.currency
      ? ` — ${l.unitPrice} ${l.currency}/${locale === "ar" ? "وحدة" : "unit"}`
      : "";
  return `- ${name} × ${l.quantity}${price}`;
}

export function buildWholesaleHandoffMessage(
  payload: WholesaleHandoffPayload
): string {
  const isAr = payload.locale === "ar";
  const lineBlock = payload.lines.map((l) => lineText(payload.locale, l)).join("\n");
  const trader = [payload.traderName, payload.traderCompany]
    .filter(Boolean)
    .join(" — ");
  const notes = payload.traderNotes.trim() || (isAr ? "(لا ملاحظات)" : "(none)");

  if (isAr) {
    return [
      "RARE OUD — تأكيد طلب جملة",
      `المرجع: ${payload.reference}`,
      `التاجر: ${trader}`,
      `الهاتف: ${payload.traderPhone}`,
      `نمط الطلب: ${payload.requestMode === "propose_price" ? "اقتراح سعر" : "طلب عرض سعر"}`,
      "البنود:",
      lineBlock,
      ...(payload.quoteMessage ? [`ملاحظة عرض السعر: ${payload.quoteMessage}`] : []),
      ...(payload.destinationCountry ? [`الوجهة: ${payload.destinationCountry}`] : []),
      ...(payload.shippingMethodLabel
        ? [`تفضيل الشحن: ${payload.shippingMethodLabel}`]
        : []),
      ...(payload.shippingCost
        ? [`تقدير الشحن: ${payload.shippingCost.amount} ${payload.shippingCost.currency}`]
        : []),
      `ملاحظات التاجر: ${notes}`,
      "",
      "أؤكد هذا الطلب من طرفي. بانتظار تأكيد الإدارة والتفاصيل النهائية للدفع والتسليم.",
    ].join("\n");
  }

  return [
    "RARE OUD — Wholesale order confirmation",
    `Reference: ${payload.reference}`,
    `Trader: ${trader}`,
    `Phone: ${payload.traderPhone}`,
    `Request mode: ${payload.requestMode === "propose_price" ? "Proposed price" : "Quote request"}`,
    "Lines:",
    lineBlock,
    ...(payload.quoteMessage ? [`Quote note: ${payload.quoteMessage}`] : []),
    ...(payload.destinationCountry ? [`Destination: ${payload.destinationCountry}`] : []),
    ...(payload.shippingMethodLabel
      ? [`Shipping preference: ${payload.shippingMethodLabel}`]
      : []),
    ...(payload.shippingCost
      ? [`Shipping estimate: ${payload.shippingCost.amount} ${payload.shippingCost.currency}`]
      : []),
    `Trader notes: ${notes}`,
    "",
    "I confirm this order. Waiting for admin confirmation and final payment/delivery details.",
  ].join("\n");
}

export async function prepareWholesaleHandoff(
  messageText: string
): Promise<WholesaleHandoffResult> {
  const businessE164 = await resolveBusinessE164();
  const deepLink = buildWhatsAppDeepLink(businessE164, messageText);
  return { businessE164, messageText, deepLink };
}
