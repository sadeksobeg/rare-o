export const TRADER_ACCOUNT_STATUSES = ["active", "disabled"] as const;
export type TraderAccountStatus = (typeof TRADER_ACCOUNT_STATUSES)[number];

export const DEAL_KINDS = ["catalog", "non_catalog"] as const;
export type DealKind = (typeof DEAL_KINDS)[number];

export const DEAL_STATUSES = [
  "proposed",
  "negotiating",
  "accepted",
  "closed",
] as const;
export type DealStatus = (typeof DEAL_STATUSES)[number];

export const NEGOTIATION_ACTIONS = [
  "propose",
  "continue",
  "counter",
  "accept",
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
 * propose is create-only; continue/counter keep/move to negotiating.
 */
export function nextDealStatusForAction(
  current: DealStatus,
  action: NegotiationAction
): DealStatus {
  if (action === "propose") return "proposed";
  if (action === "accept") return "accepted";
  if (action === "close") return "closed";
  if (action === "continue" || action === "counter") {
    if (!isOpenDealStatus(current)) return current;
    return "negotiating";
  }
  return current;
}
