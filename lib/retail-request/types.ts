import type { RetailRequestStatus } from "@/lib/retail-request/constants";

export type HandoffPayload = {
  reference: string;
  locale: string;
  status: RetailRequestStatus;
  lines: Array<{
    productId: string | null;
    nameAr: string;
    nameEn: string;
    qty: number;
    unitPriceSnapshot: number;
    lineTotal: number;
    currency: string;
  }>;
  subtotal: number;
  currency: string;
  customer: { name: string; phone: string; notes: string };
  destinationCountry: string;
  destinationCode: string | null;
  shippingMethodCode: string | null;
  shippingMethodLabel: string | null;
  /** Calculator estimate (lib/shipping/rates.ts) — not a charge, no payment gateway exists */
  shippingCharge: { amount: number; currency: string } | null;
  packagingCharge: null;
  createdAt: string;
};
