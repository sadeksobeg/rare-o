export const BROKERAGE_STATUSES = [
  "SUBMITTED",
  "NEEDS_INFO",
  "ACCEPTED",
  "INSPECTION_SCHEDULED",
  "INSPECTED",
  "QUOTE_SENT",
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

export const BROKERAGE_LIFECYCLE: BrokerageStatus[] = [
  "SUBMITTED",
  "ACCEPTED",
  "INSPECTION_SCHEDULED",
  "INSPECTED",
  "QUOTE_SENT",
  "APPROVED",
  "PURCHASED",
  "SHIPPED",
  "DELIVERED",
];

const ADMIN_TRANSITIONS: Partial<Record<BrokerageStatus, BrokerageStatus[]>> = {
  SUBMITTED: ["NEEDS_INFO", "ACCEPTED", "DECLINED"],
  NEEDS_INFO: ["ACCEPTED", "DECLINED", "CANCELLED"],
  ACCEPTED: ["INSPECTION_SCHEDULED", "DECLINED"],
  INSPECTION_SCHEDULED: ["INSPECTED", "CANCELLED"],
  INSPECTED: ["QUOTE_SENT", "DECLINED"],
  QUOTE_SENT: ["DECLINED"],
  APPROVED: ["PURCHASED", "CANCELLED"],
  PURCHASED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["CLOSED"],
};

const TRADER_TRANSITIONS: Partial<Record<BrokerageStatus, BrokerageStatus[]>> = {
  QUOTE_SENT: ["APPROVED", "REJECTED"],
  NEEDS_INFO: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["CANCELLED"],
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
