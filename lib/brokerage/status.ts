export const BROKERAGE_STATUSES = [
  "SUBMITTED",
  "NEEDS_INFO",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "ACCEPTED",
  "INSPECTION_SCHEDULED",
  "INSPECTED",
  /** @deprecated legacy quote-first path — kept for historical rows */
  "QUOTE_SENT",
  /** @deprecated legacy quote-first path — kept for historical rows */
  "APPROVED",
  "PURCHASED",
  "SHIPPED",
  "DELIVERED",
  "CLOSED",
  "DECLINED",
  "REJECTED",
  "CANCELLED",
] as const;

export type BrokerageStatus = (typeof BROKERAGE_STATUSES)[number];

/**
 * Happy path for new requests (2026-11-15): review → inspection → purchase → PAYMENT (last stage) → shipping → delivery.
 * Requests created before this change may still carry the old payment-first statuses; those keep working.
 */
export const BROKERAGE_LIFECYCLE: BrokerageStatus[] = [
  "SUBMITTED",
  "ACCEPTED",
  "INSPECTION_SCHEDULED",
  "INSPECTED",
  "PURCHASED",
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "SHIPPED",
  "DELIVERED",
];

const ADMIN_TRANSITIONS: Partial<Record<BrokerageStatus, BrokerageStatus[]>> = {
  SUBMITTED: ["NEEDS_INFO", "ACCEPTED", "DECLINED"],
  NEEDS_INFO: ["ACCEPTED", "DECLINED", "CANCELLED"],
  ACCEPTED: ["INSPECTION_SCHEDULED", "DECLINED"],
  INSPECTION_SCHEDULED: ["INSPECTED", "CANCELLED"],
  INSPECTED: ["PURCHASED", "DECLINED"],
  PURCHASED: ["AWAITING_PAYMENT", "SHIPPED"],
  AWAITING_PAYMENT: ["PAYMENT_CONFIRMED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["SHIPPED", "ACCEPTED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["CLOSED"],
  /* Legacy quote path — still transitionable for old rows */
  QUOTE_SENT: ["DECLINED"],
  APPROVED: ["PURCHASED", "CANCELLED"],
};

const TRADER_TRANSITIONS: Partial<Record<BrokerageStatus, BrokerageStatus[]>> = {
  /* Legacy */
  QUOTE_SENT: ["APPROVED", "REJECTED"],
  NEEDS_INFO: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["CANCELLED"],
  ACCEPTED: ["CANCELLED"],
  INSPECTION_SCHEDULED: ["CANCELLED"],
  AWAITING_PAYMENT: [],
};

export function canAdminTransition(from: string, to: string): boolean {
  return (ADMIN_TRANSITIONS[from as BrokerageStatus] ?? []).includes(
    to as BrokerageStatus
  );
}

export function canTraderTransition(from: string, to: string): boolean {
  return (TRADER_TRANSITIONS[from as BrokerageStatus] ?? []).includes(
    to as BrokerageStatus
  );
}

export function nextActor(status: string): "admin" | "trader" | "none" {
  switch (status) {
    case "SUBMITTED":
    case "ACCEPTED":
    case "INSPECTION_SCHEDULED":
    case "INSPECTED":
    case "PAYMENT_CONFIRMED":
    case "APPROVED":
    case "SHIPPED":
    case "DELIVERED":
    case "PURCHASED":
      return "admin";
    case "NEEDS_INFO":
    case "QUOTE_SENT":
    case "AWAITING_PAYMENT":
      return "trader";
    default:
      return "none";
  }
}

/** Terminal / inactive for KPI «active brokerage». */
export const BROKERAGE_TERMINAL: readonly BrokerageStatus[] = [
  "CLOSED",
  "DECLINED",
  "REJECTED",
  "CANCELLED",
];
