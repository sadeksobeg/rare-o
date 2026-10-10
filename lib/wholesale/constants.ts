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
