export const TRADER_ACCOUNT_STATUSES = ["active", "disabled"] as const;
export type TraderAccountStatus = (typeof TRADER_ACCOUNT_STATUSES)[number];

export const DEAL_KINDS = ["catalog", "non_catalog"] as const;
export type DealKind = (typeof DEAL_KINDS)[number];

export const DEAL_STATUSES = [
  "proposed",
  "negotiating",
  "accepted",
  "awaiting_payment",
  "payment_confirmed",
  "rejected",
  "closed",
] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const NEGOTIATION_ACTIONS = [
  "propose",
  "continue",
  "counter",
  "accept",
  "reject",
  "close",
] as const;
export type NegotiationAction = (typeof NEGOTIATION_ACTIONS)[number];

export const NEGOTIATION_ACTOR_ROLES = ["trader", "admin"] as const;
export type NegotiationActorRole = (typeof NEGOTIATION_ACTOR_ROLES)[number];

export const PUBLIC_OFFER_STATUSES = [
  "draft",
  "published",
  "unpublished",
] as const;
export type PublicOfferStatus = (typeof PUBLIC_OFFER_STATUSES)[number];

/** Negotiation actions allowed while a deal is still open. */
export const OPEN_DEAL_NEGOTIATION_ACTIONS = [
  "continue",
  "counter",
  "accept",
  "reject",
  "close",
] as const;

export function isDealStatus(value: string): value is DealStatus {
  return (DEAL_STATUSES as readonly string[]).includes(value);
}

export function isNegotiationAction(value: string): value is NegotiationAction {
  return (NEGOTIATION_ACTIONS as readonly string[]).includes(value);
}

export function isOpenDealStatus(status: DealStatus): boolean {
  return status === "proposed" || status === "negotiating";
}

/**
 * Maps a negotiation action to the resulting deal status.
 * Admin/trader accept → awaiting_payment (payment-first, 2026-11-03).
 */
export function nextDealStatusForAction(
  current: DealStatus,
  action: NegotiationAction
): DealStatus {
  if (action === "propose") return "proposed";
  if (action === "accept") return "awaiting_payment";
  if (action === "reject") return "rejected";
  if (action === "close") return "closed";
  if (action === "continue" || action === "counter") {
    if (!isOpenDealStatus(current)) return current;
    return "negotiating";
  }
  return current;
}

/**
 * Where a deal stands. After "awaiting_payment" the deal moves through
 * payment → shipping → ready_to_complete → completed; each side only sees the step that applies.
 */
export type DealPhase =
  | "negotiating"
  | "payment"
  | "shipping"
  | "ready_to_complete"
  | "completed"
  | "rejected"
  | "closed";

export function dealPhase(d: {
  status: string;
  shippedAt: Date | null;
  completedAt: Date | null;
}): DealPhase {
  switch (d.status) {
    case "proposed":
    case "negotiating":
    case "accepted":
      return "negotiating";
    case "awaiting_payment":
      return "payment";
    case "payment_confirmed":
      if (d.completedAt) return "completed";
      return d.shippedAt ? "ready_to_complete" : "shipping";
    case "rejected":
      return "rejected";
    default:
      return d.completedAt ? "completed" : "closed";
  }
}
