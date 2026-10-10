export const RETAIL_REQUEST_STATUSES = [
  "draft",
  "ready_for_handoff",
  "handoff_opened",
  "in_follow_up",
  "completed",
  "cancelled",
] as const;

export type RetailRequestStatus = (typeof RETAIL_REQUEST_STATUSES)[number];

/** Statuses allowed when creating a retail request from the storefront cart. */
export const RETAIL_REQUEST_CREATE_STATUSES = [
  "draft",
  "ready_for_handoff",
] as const;

export type RetailRequestCreateStatus =
  (typeof RETAIL_REQUEST_CREATE_STATUSES)[number];

/**
 * Server-side allowed transitions (Week 3).
 * Admin retrigger regenerates handoff artifacts without inventing a new request
 * and does not require a status change by itself.
 */
export const RETAIL_REQUEST_TRANSITIONS: Record<
  RetailRequestStatus,
  readonly RetailRequestStatus[]
> = {
  draft: ["ready_for_handoff", "cancelled"],
  ready_for_handoff: ["handoff_opened", "cancelled"],
  handoff_opened: ["in_follow_up", "completed", "cancelled"],
  in_follow_up: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isRetailRequestStatus(
  value: string
): value is RetailRequestStatus {
  return (RETAIL_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function canTransitionRetailRequest(
  from: RetailRequestStatus,
  to: RetailRequestStatus
): boolean {
  return RETAIL_REQUEST_TRANSITIONS[from].includes(to);
}
