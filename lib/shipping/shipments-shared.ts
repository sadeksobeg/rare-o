/** Client-safe shipment constants/types (no Prisma). */
export const SHIPMENT_STATUSES = [
  "CONFIRMED",
  "PACKED",
  "HANDED_OVER",
  "IN_TRANSIT",
  "ARRIVED",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_AR: Record<string, string> = {
  CONFIRMED: "مؤكَّد",
  PACKED: "مغلَّف",
  HANDED_OVER: "سُلِّم للناقل",
  IN_TRANSIT: "في الطريق",
  ARRIVED: "وصل",
  DELIVERED: "تم التسليم",
  FAILED: "تعذّر التسليم",
  RETURNED: "مرتجع",
  CANCELLED: "ملغى",
};
export const SHIPMENT_STATUS_EN: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  HANDED_OVER: "Handed to carrier",
  IN_TRANSIT: "In transit",
  ARRIVED: "Arrived",
  DELIVERED: "Delivered",
  FAILED: "Delivery failed",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

export type AdminShipmentRow = {
  id: string;
  status: string;
  methodLabel: string;
  carrierLabel: string;
  destCountry: string;
  destCity: string;
  trackingNumber: string | null;
  publicToken: string;
  createdAt: string;
  parentLabel: string;
  next: ShipmentStatus[];
};
