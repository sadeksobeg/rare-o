/**
 * Wholesale domain constants.
 * Dedicated lifecycle — do NOT reuse DealProposal statuses.
 */

export const WHOLESALE_REQUEST_MODES = [
  "request_quote",
  "propose_price",
] as const;
export type WholesaleRequestMode = (typeof WHOLESALE_REQUEST_MODES)[number];

export const WHOLESALE_STATUSES = [
  "submitted",
  "under_review",
  "quote_provided",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type WholesaleStatus = (typeof WHOLESALE_STATUSES)[number];

/**
 * Technical abuse-protection upper bound for line quantity.
 * NOT a commercial MOQ. MOQ remains OPEN and is not enforced.
 */
export const WHOLESALE_QTY_TECHNICAL_MAX = 10_000;

export const WHOLESALE_TRANSITIONS: Record<
  WholesaleStatus,
  readonly WholesaleStatus[]
> = {
  submitted: ["under_review", "cancelled"],
  under_review: ["quote_provided", "confirmed", "cancelled"],
  quote_provided: ["confirmed", "under_review", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isWholesaleStatus(value: string): value is WholesaleStatus {
  return (WHOLESALE_STATUSES as readonly string[]).includes(value);
}

export function isWholesaleRequestMode(
  value: string
): value is WholesaleRequestMode {
  return (WHOLESALE_REQUEST_MODES as readonly string[]).includes(value);
}

export function canTransitionWholesale(
  from: WholesaleStatus,
  to: WholesaleStatus
): boolean {
  return WHOLESALE_TRANSITIONS[from].includes(to);
}

export function isOpenWholesaleStatus(status: WholesaleStatus): boolean {
  return (
    status === "submitted" ||
    status === "under_review" ||
    status === "quote_provided" ||
    status === "confirmed"
  );
}

/**
 * Where a request stands inside its lifecycle. "confirmed" is split into phases so each side
 * only ever sees (and can only do) the step that applies:
 * awaiting_trader → payment → shipping → ready_to_complete.
 */
export type WholesalePhase =
  | "new"
  | "review"
  | "quoted"
  | "awaiting_trader"
  | "payment"
  | "shipping"
  | "ready_to_complete"
  | "completed"
  | "cancelled";

export function wholesalePhase(r: {
  status: string;
  traderConfirmedAt: Date | null;
  paymentConfirmedAt: Date | null;
  shippedAt: Date | null;
}): WholesalePhase {
  switch (r.status) {
    case "submitted":
      return "new";
    case "under_review":
      return "review";
    case "quote_provided":
      return "quoted";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "confirmed":
      if (!r.traderConfirmedAt) return "awaiting_trader";
      if (!r.paymentConfirmedAt) return "payment";
      if (!r.shippedAt) return "shipping";
      return "ready_to_complete";
    default:
      return "new";
  }
}
