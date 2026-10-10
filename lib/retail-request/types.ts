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
  shippingMethodCode: string | null;
  shippingMethodLabel: string | null;
  shippingCharge: null;
  packagingCharge: null;
  createdAt: string;
};
