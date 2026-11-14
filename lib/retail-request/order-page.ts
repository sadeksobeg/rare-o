/**
 * Customer-facing order page (/order/<token>) + the confirmation message the
 * team sends over WhatsApp. The customer reviews their own data and answers
 * with two buttons: confirm, or ask for changes. Nothing here sends a message
 * by itself — sending is always an explicit admin action.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { isFullName, isValidPhone } from "@/lib/validation/customer-identity";
import { CUSTOMER_SHIPMENT_TEXT, formatEta, paymentLabel } from "@/lib/retail-request/shipment-text";

export function newOrderToken(): string {
  return randomBytes(18).toString("base64url");
}

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
export function isPlausibleOrderToken(t: string): boolean {
  return TOKEN_RE.test(t);
}

export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://rareoud.com").replace(/\/+$/, "");
}

export function orderPageUrl(token: string): string {
  return `${siteBaseUrl()}/order/${token}`;
}

/** Lazily gives old requests a token (new ones get it at creation). */
export async function ensureOrderToken(requestId: string): Promise<string | null> {
  const row = await prisma.retailRequest.findUnique({
    where: { id: requestId },
    select: { publicToken: true },
  });
  if (!row) return null;
  if (row.publicToken) return row.publicToken;
  for (let i = 0; i < 4; i += 1) {
    const token = newOrderToken();
    try {
      await prisma.retailRequest.update({ where: { id: requestId }, data: { publicToken: token } });
      return token;
    } catch (e) {
      if ((e as { code?: string })?.code !== "P2002") throw e;
    }
  }
  return null;
}

const num = (v: unknown) => Number(v);
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);

type MessageInput = {
  locale: "ar" | "en";
  reference: string;
  customerName: string;
  customerPhone: string;
  destinationCountry: string;
  customerNotes: string;
  currency: string;
  subtotal: number;
  shippingCostAmount: number | null;
  shippingCostCurrency: string | null;
  shippingMethodLabel: string | null;
  lines: { name: string; quantity: number; lineTotal: number }[];
  link: string;
  missing: string[];
};

/** Fields the team still needs (shown to the customer as a reminder). */
export function missingCustomerData(input: {
  customerName: string;
  customerPhone: string;
  destinationCountry: string;
}): string[] {
  const out: string[] = [];
  if (!isFullName(input.customerName)) out.push("name");
  if (!isValidPhone(input.customerPhone)) out.push("phone");
  const dest = input.destinationCountry.trim();
  if (!dest || dest === "غير محدد") out.push("destination");
  return out;
}

export function buildConfirmationMessage(m: MessageInput): string {
  const ar = m.locale === "ar";
  const total =
    m.shippingCostAmount != null && m.shippingCostCurrency === m.currency
      ? m.subtotal + m.shippingCostAmount
      : null;
  const lines = m.lines
    .map((l) => `• ${l.name} × ${l.quantity} — ${fmt(l.lineTotal)} ${m.currency}`)
    .join("\n");
  const ship =
    m.shippingCostAmount != null && m.shippingCostCurrency
      ? `${fmt(m.shippingCostAmount)} ${m.shippingCostCurrency}${m.shippingMethodLabel ? ` (${m.shippingMethodLabel})` : ""}`
      : ar
        ? "يُحدَّد بعد التأكيد"
        : "to be confirmed";
  const labels = {
    name: ar ? "الاسم الثلاثي" : "Full name",
    phone: ar ? "الهاتف" : "Phone",
    dest: ar ? "الوجهة" : "Destination",
  };
  const reminders = m.missing.length
    ? ar
      ? `\n⚠️ ينقصنا أو يحتاج تصحيحاً: ${m.missing
          .map((k) => ({ name: "الاسم الثلاثي", phone: "رقم الهاتف", destination: "الوجهة" })[k as "name"])
          .join("، ")}.`
      : `\n⚠️ Missing or needs correction: ${m.missing
          .map((k) => ({ name: "full name", phone: "phone number", destination: "destination" })[k as "name"])
          .join(", ")}.`
    : "";

  if (ar) {
    return [
      `مرحباً ${m.customerName}،`,
      `هذه بيانات طلبك ${m.reference} لدى RARE OUD — يرجى مراجعتها:`,
      `• ${labels.name}: ${m.customerName}`,
      `• ${labels.phone}: ${m.customerPhone}`,
      `• ${labels.dest}: ${m.destinationCountry}`,
      lines,
      `المجموع: ${fmt(m.subtotal)} ${m.currency}`,
      `الشحن (تقدير): ${ship}`,
      ...(total != null ? [`الإجمالي التقديري: ${fmt(total)} ${m.currency}`] : []),
      ...(m.customerNotes ? [`ملاحظاتك: ${m.customerNotes}`] : []),
      reminders,
      "",
      "للتأكيد أو طلب تعديل اضغط الرابط:",
      m.link,
      "أو ردّ هنا بكلمة «تأكيد»، أو اكتب التعديل المطلوب وسنحدّث الطلب.",
    ]
      .filter((x) => x !== "")
      .join("\n");
  }
  return [
    `Hello ${m.customerName},`,
    `Here are the details of your RARE OUD request ${m.reference} — please review:`,
    `• ${labels.name}: ${m.customerName}`,
    `• ${labels.phone}: ${m.customerPhone}`,
    `• ${labels.dest}: ${m.destinationCountry}`,
    lines,
    `Subtotal: ${fmt(m.subtotal)} ${m.currency}`,
    `Shipping (estimate): ${ship}`,
    ...(total != null ? [`Estimated total: ${fmt(total)} ${m.currency}`] : []),
    ...(m.customerNotes ? [`Your notes: ${m.customerNotes}`] : []),
    reminders,
    "",
    "To confirm or ask for changes, open:",
    m.link,
    "Or reply here with “confirm”, or write the change you need and we will update the request.",
  ]
    .filter((x) => x !== "")
    .join("\n");
}

/** Short status update that carries the order-page link. */
export function buildStatusUpdateMessage(input: {
  locale: "ar" | "en";
  name: string;
  reference: string;
  status: string;
  link: string;
}): string {
  const ar = input.locale === "ar";
  const label: Record<string, [string, string]> = {
    in_follow_up: ["قيد المتابعة — نعمل على تجهيز طلبك", "In follow-up — we are preparing your request"],
    completed: ["مكتمل — شكراً لثقتك بـ RARE OUD", "Completed — thank you for choosing RARE OUD"],
    cancelled: ["أُلغي — تواصل معنا إن كان هذا غير مقصود", "Cancelled — contact us if this is unexpected"],
  };
  const l = label[input.status];
  const text = l ? (ar ? l[0] : l[1]) : input.status;
  return ar
    ? `مرحباً ${input.name}،\nتحديث طلبك ${input.reference}: ${text}.\nتفاصيل الطلب وحالته: ${input.link}`
    : `Hello ${input.name},\nUpdate on your request ${input.reference}: ${text}.\nDetails and status: ${input.link}`;
}

export type PublicOrderView = {
  reference: string;
  status: string;
  customerName: string;
  phone: string;
  destinationCountry: string;
  customerNotes: string;
  currency: string;
  subtotal: number;
  shipping: { amount: number; currency: string; label: string | null } | null;
  total: number | null;
  lines: { name: string; quantity: number; lineTotal: number }[];
  createdAt: string;
  response: "confirmed" | "changes_requested" | null;
  responseNote: string;
  respondedAt: string | null;
  locale: "ar" | "en";
  shipment: { status: string; trackingToken: string; trackingNumber: string | null } | null;
  paymentLabel: string | null;
  etaLabel: string | null;
  /** Newest first: what the team posted about the shipment (customer wording + their note). */
  updates: { status: string; title: string; note: string; at: string }[];
};

export async function getPublicOrder(token: string): Promise<PublicOrderView | null> {
  if (!isPlausibleOrderToken(token)) return null;
  const r = await prisma.retailRequest.findUnique({
    where: { publicToken: token },
    include: {
      lines: true,
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          publicToken: true,
          trackingNumber: true,
          events: { orderBy: { at: "desc" }, take: 8, select: { status: true, note: true, at: true } },
        },
      },
    },
  });
  if (!r) return null;
  const sh = r.shipments[0];
  const ship =
    r.shippingCostAmount != null && r.shippingCostCurrency
      ? { amount: num(r.shippingCostAmount), currency: r.shippingCostCurrency, label: r.shippingMethodLabel }
      : null;
  const subtotal = num(r.subtotal);
  return {
    reference: r.reference,
    status: r.status,
    customerName: r.customerName,
    // Reachable only with the unguessable token the customer received on their own
    // chat; they must see their own number exactly as stored.
    phone: r.customerPhone,
    destinationCountry: r.destinationCountry,
    customerNotes: r.customerNotes,
    currency: r.currency,
    subtotal,
    shipping: ship,
    total: ship && ship.currency === r.currency ? subtotal + ship.amount : null,
    lines: r.lines.map((l) => ({
      name: r.locale === "en" ? l.productNameEn || l.productNameAr : l.productNameAr,
      quantity: l.quantity,
      lineTotal: num(l.lineTotal),
    })),
    createdAt: r.createdAt.toISOString(),
    response:
      r.customerResponse === "confirmed" || r.customerResponse === "changes_requested"
        ? r.customerResponse
        : null,
    responseNote: r.customerResponseNote ?? "",
    respondedAt: r.customerRespondedAt?.toISOString() ?? null,
    locale: r.locale === "en" ? "en" : "ar",
    shipment: sh ? { status: sh.status, trackingToken: sh.publicToken, trackingNumber: sh.trackingNumber } : null,
    paymentLabel: paymentLabel(r.paymentMode, Boolean(r.paymentConfirmedAt), r.locale !== "en"),
    etaLabel: formatEta(r.etaMinDays, r.etaMaxDays, r.locale !== "en"),
    updates: (sh?.events ?? []).map((e) => ({
      status: e.status,
      title: (CUSTOMER_SHIPMENT_TEXT[e.status] ?? [e.status, e.status])[r.locale === "en" ? 1 : 0],
      note: e.note,
      at: e.at.toISOString(),
    })),
  };
}

export async function submitCustomerResponse(input: {
  token: string;
  response: "confirmed" | "changes_requested";
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isPlausibleOrderToken(input.token)) return { ok: false, error: "NOT_FOUND" };
  const note = (input.note ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 1000);
  if (input.response === "changes_requested" && note.length < 3) {
    return { ok: false, error: "NOTE_REQUIRED" };
  }
  const r = await prisma.retailRequest.findUnique({
    where: { publicToken: input.token },
    select: { id: true, status: true },
  });
  if (!r) return { ok: false, error: "NOT_FOUND" };
  if (r.status === "completed" || r.status === "cancelled") {
    return { ok: false, error: "REQUEST_CLOSED" };
  }
  await prisma.$transaction([
    prisma.retailRequest.update({
      where: { id: r.id },
      data: {
        customerResponse: input.response,
        customerResponseNote: input.response === "changes_requested" ? note : note || null,
        customerRespondedAt: new Date(),
      },
    }),
    prisma.retailHandoffEvent.create({
      data: {
        requestId: r.id,
        eventType:
          input.response === "confirmed" ? "customer_confirmed" : "customer_changes_requested",
        actor: "customer",
        note: note || null,
      },
    }),
  ]);
  return { ok: true };
}
