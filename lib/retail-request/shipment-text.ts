/** Customer-facing wording for the shipping part of a retail request. */

export const CUSTOMER_SHIPMENT_TEXT: Record<string, [string, string]> = {
  CONFIRMED: ["أُنشئت شحنتك", "Your shipment was created"],
  PACKED: ["جُهّزت قطعتك وغُلّفت", "Your piece is packed"],
  HANDED_OVER: ["سُلّمت الشحنة للناقل", "Handed over to the carrier"],
  IN_TRANSIT: ["شحنتك في الطريق إليك", "Your shipment is on its way"],
  ARRIVED: ["وصلت شحنتك إلى المكان المتفق عليه", "Your shipment arrived at the agreed place"],
  DELIVERED: ["تم تسليم شحنتك — نتمنى أن تسعدك", "Your shipment was delivered — enjoy it"],
  FAILED: ["تعذّر تسليم الشحنة — سنتواصل معك", "Delivery failed — we will contact you"],
  RETURNED: ["أُعيدت الشحنة — سنتواصل معك", "Shipment returned — we will contact you"],
  CANCELLED: ["أُلغيت الشحنة", "Shipment cancelled"],
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
  const line = ar ? `${t[0]}.` : `${t[1]}.`;
  const etaVisible =
    input.eta && ["CONFIRMED", "PACKED", "HANDED_OVER", "IN_TRANSIT"].includes(input.status);
  return [
    ar ? `مرحباً ${input.name}،` : `Hello ${input.name},`,
    ar ? `تحديث طلبك ${input.reference}: ${line}` : `Update on your request ${input.reference}: ${line}`,
    ...(input.note ? [input.note] : []),
    ...(input.tracking ? [ar ? `رقم التتبع: ${input.tracking}` : `Tracking: ${input.tracking}`] : []),
    ...(etaVisible ? [ar ? `الوصول المتوقع: ${input.eta}` : `Expected delivery: ${input.eta}`] : []),
    ar ? `تابع كل التفاصيل: ${input.link}` : `Follow everything here: ${input.link}`,
  ].join("\n");
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
  const first = input.name.trim().split(/\s+/)[0] || input.name;
  if (input.locale === "en") {
    if (input.mode === "cod")
      return `Hello ${first}, for request ${input.reference} payment will be on delivery. Follow your order here: ${input.link}`;
    if (input.confirmed)
      return `Hello ${first}, we received your payment for request ${input.reference}. Thank you! Follow your order here: ${input.link}`;
    return `Hello ${first}, request ${input.reference} is paid in advance. Please complete the payment as agreed, then reply here or tap "I have paid" on your order page: ${input.link}`;
  }
  if (input.mode === "cod")
    return `أهلاً ${first}، طلبك ${input.reference} سيكون الدفع فيه عند الاستلام. تابع طلبك من هنا: ${input.link}`;
  if (input.confirmed)
    return `أهلاً ${first}، استلمنا دفعتك لطلب ${input.reference}. شكراً لك! تابع طلبك من هنا: ${input.link}`;
  return `أهلاً ${first}، طلبك ${input.reference} بنظام الدفع المسبق. يرجى إتمام الدفع حسب المتفق عليه، ثم ردّ علينا هنا أو اضغط «أرسلتُ الدفعة» في صفحة طلبك: ${input.link}`;
}
