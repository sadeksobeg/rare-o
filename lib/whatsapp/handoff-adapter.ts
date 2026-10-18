/**
 * WhatsApp handoff helpers — Week 3.
 *
 * Uses prefilled wa.me deep links + stored message text only.
 * Does NOT call WhatsApp Business API.
 * Does NOT implement inbox / conversation UI.
 * Live Baileys/QR linking is implemented via the WhatsApp worker (§09).
 */

import type { HandoffPayload } from "@/lib/retail-request/types";

export type WhatsAppDeepLinkResult = {
  businessE164: string;
  messageText: string;
  deepLink: string;
};

export function getWhatsAppBusinessE164(): string {
  const raw = process.env.WHATSAPP_BUSINESS_E164?.trim() ?? "";
  if (!raw) {
    throw new Error("WHATSAPP_BUSINESS_E164_MISSING");
  }
  // Digits only for wa.me (no +, spaces, dashes)
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new Error("WHATSAPP_BUSINESS_E164_INVALID");
  }
  return digits;
}

export function buildHandoffMessageText(payload: HandoffPayload): string {
  const isAr = payload.locale === "ar";
  const lineBlock = payload.lines
    .map((l) => {
      const name = isAr ? l.nameAr || l.nameEn : l.nameEn || l.nameAr;
      return `- ${name} × ${l.qty} (${l.lineTotal} ${l.currency})`;
    })
    .join("\n");

  const shipping =
    payload.shippingMethodLabel ||
    payload.shippingMethodCode ||
    (isAr ? "(يُؤكَّد مع الفريق)" : "(confirm with team)");

  const notes = payload.customer.notes?.trim()
    ? payload.customer.notes.trim()
    : isAr
      ? "(لا ملاحظات)"
      : "(none)";

  if (isAr) {
    return [
      "RARE OUD — تحويل طلب تجزئة",
      `المرجع: ${payload.reference}`,
      `العميل: ${payload.customer.name}`,
      `الهاتف: ${payload.customer.phone}`,
      `الوجهة: ${payload.destinationCountry}`,
      `تفضيل الشحن: ${shipping}`,
      `المجموع الفرعي: ${payload.subtotal} ${payload.currency}`,
      "البنود:",
      lineBlock,
      `ملاحظات: ${notes}`,
      "",
      "هذا تحويل طلب — وليس طلباً مدفوعاً عبر الموقع.",
    ].join("\n");
  }

  return [
    "RARE OUD — Retail request handoff",
    `Reference: ${payload.reference}`,
    `Customer: ${payload.customer.name}`,
    `Phone: ${payload.customer.phone}`,
    `Destination: ${payload.destinationCountry}`,
    `Shipping preference: ${shipping}`,
    `Subtotal: ${payload.subtotal} ${payload.currency}`,
    "Lines:",
    lineBlock,
    `Notes: ${notes}`,
    "",
    "This is a request handoff — not a paid order.",
  ].join("\n");
}

export function buildWhatsAppDeepLink(
  businessE164Digits: string,
  messageText: string
): string {
  const text = encodeURIComponent(messageText);
  return `https://wa.me/${businessE164Digits}?text=${text}`;
}

export function prepareWhatsAppHandoff(
  payload: HandoffPayload
): WhatsAppDeepLinkResult {
  const businessE164 = getWhatsAppBusinessE164();
  const messageText = buildHandoffMessageText(payload);
  const deepLink = buildWhatsAppDeepLink(businessE164, messageText);
  return { businessE164, messageText, deepLink };
}

/** Explicit guard: Week 3 must not register a Business API sender. */
export function assertNoWhatsAppBusinessApiSend(): void {
  // Intentionally empty — Business API send path is not implemented.
  // Kept as a named gate so future send adapters must clear this review point.
}
