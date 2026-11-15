import { composeMessage } from "@/lib/messaging/compose";

/** Customer-facing wording for the shipping part of a retail request. */

export const CUSTOMER_SHIPMENT_TEXT: Record<string, [string, string]> = {
  CONFIRMED: ["تم إنشاء شحنتك", "Your shipment has been created"],
  PACKED: ["تم تجهيز طلبك وتغليفه", "Your order has been packed"],
  HANDED_OVER: ["تم تسليم الشحنة إلى شركة الشحن", "Your shipment was handed to the carrier"],
  IN_TRANSIT: ["شحنتك في الطريق إليك", "Your shipment is on its way"],
  ARRIVED: ["وصلت شحنتك إلى نقطة التسليم المتفق عليها", "Your shipment has reached the agreed delivery point"],
  DELIVERED: ["تم تسليم طلبك — نتمنى أن تسعدك قطعتك", "Your order was delivered — we hope you love it"],
  FAILED: ["تعذّر تسليم الشحنة وسنتواصل معك لترتيب موعد جديد", "Delivery was unsuccessful — we will contact you to rearrange"],
  RETURNED: ["أُعيدت الشحنة إلينا وسنتواصل معك", "The shipment was returned to us — we will contact you"],
  CANCELLED: ["تم إلغاء الشحنة", "The shipment was cancelled"],
};

export function formatEta(min: number | null, max: number | null, ar: boolean): string | null {
  if (min == null && max == null) return null;
  const lo = (min ?? max) as number;
  const hi = (max ?? min) as number;
  const range = lo === hi ? `${lo}` : `${lo}–${hi}`;
  return ar ? `${range} يوماً` : `${range} days`;
}

export function paymentLabel(mode: string | null, confirmed: boolean, ar: boolean): string | null {
  if (mode === "cod") return ar ? "الدفع عند الاستلام" : "Pay on delivery";
  if (mode === "prepaid") {
    if (confirmed) return ar ? "مدفوع مسبقاً ✓" : "Paid in advance ✓";
    return ar ? "دفع مسبق — بانتظار التأكيد" : "Advance payment — awaiting confirmation";
  }
  return null;
}

export function buildShipmentUpdateMessage(input: {
  locale: "ar" | "en";
  name: string;
  reference: string;
  status: string;
  note?: string;
  eta?: string | null;
  tracking?: string | null;
  link: string;
}): string {
  const ar = input.locale === "ar";
  const t = CUSTOMER_SHIPMENT_TEXT[input.status] ?? [input.status, input.status];
  const etaVisible =
    input.eta && ["CONFIRMED", "PACKED", "HANDED_OVER", "IN_TRANSIT"].includes(input.status);
  return composeMessage({
    ar,
    name: input.name,
    headline: ar ? t[0] : t[1],
    context: ar ? `طلبك رقم ${input.reference}` : `Your order ${input.reference}`,
    details: [
      input.tracking ? (ar ? `رقم التتبع: ${input.tracking}` : `Tracking number: ${input.tracking}`) : null,
      etaVisible ? (ar ? `الوصول المتوقع: ${input.eta}` : `Estimated delivery: ${input.eta}`) : null,
    ],
    note: input.note,
    linkLabel: ar ? "لمتابعة طلبك:" : "Track your order:",
    link: input.link,
  });
}

/** WhatsApp text sent when the team fixes how the customer pays. */
export function buildPaymentMessage(input: {
  locale: "ar" | "en";
  name: string;
  reference: string;
  mode: "prepaid" | "cod";
  confirmed: boolean;
  link: string;
}): string {
  const ar = input.locale !== "en";
  const ctx = ar ? `طلبك رقم ${input.reference}` : `Your order ${input.reference}`;
  if (input.mode === "cod") {
    return composeMessage({
      ar,
      name: input.name,
      headline: ar ? "الدفع عند الاستلام" : "Payment on delivery",
      context: ctx,
      note: ar ? "لا يلزمك أي دفع الآن، تدفع عند استلام طلبك." : "No payment is needed now — you pay when your order arrives.",
      linkLabel: ar ? "لمتابعة طلبك:" : "Track your order:",
      link: input.link,
    });
  }
  if (input.confirmed) {
    return composeMessage({
      ar,
      name: input.name,
      headline: ar ? "استلمنا دفعتك، شكراً لك" : "We received your payment — thank you",
      context: ctx,
      linkLabel: ar ? "لمتابعة طلبك:" : "Track your order:",
      link: input.link,
    });
  }
  return composeMessage({
    ar,
    name: input.name,
    headline: ar ? "بانتظار إتمام الدفع" : "Awaiting your payment",
    context: ctx,
    note: ar
      ? "يرجى إتمام الدفع حسب المتفق عليه، ثم أخبرنا هنا أو اضغط «أرسلتُ الدفعة» في صفحة طلبك."
      : "Please complete the payment as agreed, then let us know here or tap “I have paid” on your order page.",
    linkLabel: ar ? "صفحة طلبك:" : "Your order page:",
    link: input.link,
  });
}
