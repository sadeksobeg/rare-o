/**
 * Payment-first WhatsApp handoff helpers for deals + brokerage.
 * Deep-link only — does not send via Baileys / Business API.
 */

import {
  buildWhatsAppDeepLink,
  getWhatsAppBusinessE164,
} from "@/lib/whatsapp/handoff-adapter";

export type PaymentHandoffResult = {
  businessE164: string;
  messageText: string;
  deepLink: string;
};

export function buildDealPaymentHandoffMessage(input: {
  locale: "ar" | "en";
  reference: string;
  title: string;
  modelNumber: string;
  price: string;
  currency: string;
  traderName: string;
}): string {
  if (input.locale === "ar") {
    return [
      "RARE OUD — دفع صفقة تاجر",
      `المرجع: ${input.reference}`,
      `العنوان: ${input.title}`,
      `رقم الموديل: ${input.modelNumber || "—"}`,
      `السعر المتفق: ${input.price} ${input.currency}`,
      `التاجر: ${input.traderName}`,
      "",
      "أتممت التحويل / الدفع. بانتظار تأكيد الإدارة لإكمال الطلب.",
    ].join("\n");
  }
  return [
    "RARE OUD — Trader deal payment",
    `Reference: ${input.reference}`,
    `Title: ${input.title}`,
    `Model number: ${input.modelNumber || "—"}`,
    `Agreed price: ${input.price} ${input.currency}`,
    `Trader: ${input.traderName}`,
    "",
    "I completed the transfer/payment. Waiting for admin confirmation to complete the order.",
  ].join("\n");
}

export function buildBrokeragePaymentHandoffMessage(input: {
  locale: "ar" | "en";
  reference: string;
  description: string;
  modelNumber: string;
  statedPriceUsd: number;
  traderName: string;
}): string {
  if (input.locale === "ar") {
    return [
      "RARE OUD — دفع طلب وساطة",
      `المرجع: ${input.reference}`,
      `الوصف: ${input.description}`,
      `رقم الموديل: ${input.modelNumber || "—"}`,
      `السعر الذي أبلغ به التاجر: ${input.statedPriceUsd} USD`,
      `التاجر: ${input.traderName}`,
      "",
      "أتممت التحويل / الدفع. بانتظار تأكيد الإدارة قبل استمرار مراحل الوساطة.",
    ].join("\n");
  }
  return [
    "RARE OUD — Brokerage payment",
    `Reference: ${input.reference}`,
    `Description: ${input.description}`,
    `Model number: ${input.modelNumber || "—"}`,
    `Trader-stated price: ${input.statedPriceUsd} USD`,
    `Trader: ${input.traderName}`,
    "",
    "I completed the transfer/payment. Waiting for admin confirmation before further brokerage stages.",
  ].join("\n");
}

export function preparePaymentHandoff(messageText: string): PaymentHandoffResult {
  const businessE164 = getWhatsAppBusinessE164();
  const deepLink = buildWhatsAppDeepLink(businessE164, messageText);
  return { businessE164, messageText, deepLink };
}
