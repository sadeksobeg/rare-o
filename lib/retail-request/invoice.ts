/**
 * Customer invoice for a retail request. Reachable only with the request's
 * unguessable order token (same trust model as the order page).
 */
import QRCode from "qrcode";
import { prisma } from "@/lib/db/prisma";
import { siteBaseUrl, isPlausibleOrderToken, orderPageUrl } from "@/lib/retail-request/order-page";
import { formatEta, paymentLabel } from "@/lib/retail-request/shipment-text";
import { resolveBusinessE164OrNull } from "@/lib/whatsapp/business-number";

export type InvoiceView = {
  number: string;
  reference: string;
  issuedAt: string;
  locale: "ar" | "en";
  status: string;
  customer: { name: string; phone: string; destination: string };
  lines: { name: string; quantity: number; unit: number; total: number }[];
  currency: string;
  subtotal: number;
  shipping: { amount: number; currency: string; label: string | null } | null;
  total: number | null;
  payment: string | null;
  etaLabel: string | null;
  tracking: string | null;
  notes: string;
  site: string;
  whatsapp: string | null;
  qr: string;
};

/** RO-2026-Z28HUC → INV-2026-Z28HUC (the invoice shares the request's unique code). */
export function invoiceNumber(reference: string): string {
  return reference.replace(/^RO-/, "INV-");
}

export async function getInvoiceByToken(token: string): Promise<InvoiceView | null> {
  if (!isPlausibleOrderToken(token)) return null;
  const r = await prisma.retailRequest.findUnique({
    where: { publicToken: token },
    include: {
      lines: true,
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { trackingNumber: true },
      },
    },
  });
  if (!r || r.status === "draft") return null;
  const ar = r.locale !== "en";
  const subtotal = Number(r.subtotal);
  const ship =
    r.shippingCostAmount != null && r.shippingCostCurrency
      ? {
          amount: Number(r.shippingCostAmount),
          currency: r.shippingCostCurrency,
          label: r.shippingMethodLabel,
        }
      : null;
  const wa = await resolveBusinessE164OrNull();
  const qr = await QRCode.toDataURL(orderPageUrl(token), { margin: 1, width: 220, color: { dark: "#2a1340", light: "#ffffff" } });
  return {
    number: invoiceNumber(r.reference),
    reference: r.reference,
    issuedAt: r.createdAt.toISOString(),
    locale: ar ? "ar" : "en",
    status: r.status,
    customer: { name: r.customerName, phone: r.customerPhone, destination: r.destinationCountry },
    lines: r.lines.map((l) => ({
      name: ar ? l.productNameAr : l.productNameEn || l.productNameAr,
      quantity: l.quantity,
      unit: Number(l.unitPriceSnapshot),
      total: Number(l.lineTotal),
    })),
    currency: r.currency,
    subtotal,
    shipping: ship,
    total: ship && ship.currency === r.currency ? subtotal + ship.amount : null,
    payment: paymentLabel(r.paymentMode, Boolean(r.paymentConfirmedAt), ar),
    etaLabel: formatEta(r.etaMinDays, r.etaMaxDays, ar),
    tracking: r.shipments[0]?.trackingNumber ?? null,
    notes: r.customerNotes,
    site: siteBaseUrl().replace(/^https?:\/\//, ""),
    whatsapp: wa ? `+${wa}` : null,
    qr,
  };
}
