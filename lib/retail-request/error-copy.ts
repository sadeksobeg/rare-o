import type { Locale } from "@/lib/i18n/config";

/** Map server/error codes to human storefront copy — never surface raw enums. */
export function retailRequestErrorCopy(
  codeOrMessage: string,
  locale: Locale
): string {
  const ar = locale === "ar";
  const code = codeOrMessage.trim();

  switch (code) {
    case "INVALID_PRODUCT":
    case "PRODUCT_NOT_PUBLISHED":
    case "PRODUCT_UNAVAILABLE":
    case "CART_ITEMS_UNAVAILABLE":
      return ar
        ? "أحد المنتجات في السلة لم يعد متاحاً. أُزيل تلقائياً — راجع السلة وأعد المحاولة."
        : "A product in your cart is no longer available. It was removed — review your cart and try again.";
    case "PRODUCT_PRICE_ON_REQUEST":
      return ar
        ? "سعر أحد المنتجات عند الطلب فقط ولا يمكن إتمام الطلب الآن."
        : "One product is price-on-request and cannot be ordered this way.";
    case "MIXED_CURRENCY_CART":
      return ar
        ? "لا يمكن تجهيز طلب يحتوي على عملات مختلفة."
        : "Your cart mixes currencies and cannot be submitted.";
    case "EMPTY_CART":
      return ar ? "سلتك فارغة." : "Your cart is empty.";
    case "WHATSAPP_BUSINESS_E164_MISSING":
      return ar
        ? "رقم واتساب العمل غير مُعدّ حالياً. حاول لاحقاً."
        : "WhatsApp business number is not configured yet. Please try later.";
    case "WHATSAPP_BUSINESS_E164_INVALID":
      return ar
        ? "رقم واتساب العمل غير صالح. حاول لاحقاً."
        : "WhatsApp business number is invalid. Please try later.";
    default:
      break;
  }

  if (/^[A-Z][A-Z0-9_]{2,}$/.test(code)) {
    return ar
      ? "تعذّر تجهيز الطلب. حاول مرة أخرى."
      : "Could not prepare the request. Please try again.";
  }

  return codeOrMessage;
}
