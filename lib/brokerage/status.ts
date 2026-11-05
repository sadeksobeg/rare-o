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

/** Happy path for new creates (payment-first, 2026-11-03). */
export const BROKERAGE_LIFECYCLE: BrokerageStatus[] = [
  "AWAITING_PAYMENT",
  "PAYMENT_CONFIRMED",
  "ACCEPTED",
  "INSPECTION_SCHEDULED",
  "INSPECTED",
  "PURCHASED",
  "SHIPPED",
  "DELIVERED",
];

const ADMIN_TRANSITIONS: Partial<Record<BrokerageStatus, BrokerageStatus[]>> = {
  SUBMITTED: ["NEEDS_INFO", "AWAITING_PAYMENT", "DECLINED"],
  NEEDS_INFO: ["AWAITING_PAYMENT", "DECLINED", "CANCELLED"],
  AWAITING_PAYMENT: ["PAYMENT_CONFIRMED", "NEEDS_INFO", "DECLINED", "CANCELLED"],
  PAYMENT_CONFIRMED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["INSPECTION_SCHEDULED", "DECLINED"],
  INSPECTION_SCHEDULED: ["INSPECTED", "CANCELLED"],
  INSPECTED: ["PURCHASED", "QUOTE_SENT", "DECLINED"],
  /* Legacy quote path — still transitionable for old rows */
  QUOTE_SENT: ["DECLINED"],
  APPROVED: ["PURCHASED", "CANCELLED"],
  PURCHASED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["CLOSED"],
};

const TRADER_TRANSITIONS: Partial<Record<BrokerageStatus, BrokerageStatus[]>> = {
  /* Legacy */
  QUOTE_SENT: ["APPROVED", "REJECTED"],
  NEEDS_INFO: ["AWAITING_PAYMENT", "CANCELLED"],
  SUBMITTED: ["CANCELLED"],
  AWAITING_PAYMENT: ["CANCELLED"],
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

export function nextActor(
  status: string
): "admin" | "trader" | "none" {
  switch (status) {
    case "SUBMITTED":
    case "AWAITING_PAYMENT":
    case "PAYMENT_CONFIRMED":
    case "ACCEPTED":
    case "INSPECTION_SCHEDULED":
    case "INSPECTED":
    case "APPROVED":
    case "PURCHASED":
    case "DELIVERED":
      return "admin";
    case "NEEDS_INFO":
    case "QUOTE_SENT":
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
