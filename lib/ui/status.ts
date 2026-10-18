/**
 * Status mapping — approved in DECISIONS-ADDENDUM.md (status table + D40).
 * `ready_for_handoff.nextActor = admin` (storefront creation state).
 */

export type StatusTone =
  | "neutral"
  | "info"
  | "progress"
  | "attention"
  | "success"
  | "danger"
  | "closed";

export type NextActor = "admin" | "trader" | "customer" | "none";

export type StatusMeta = {
  tone: StatusTone;
  labelKey: string;
  nextActor: NextActor;
};

export const RETAIL_STATUS: Record<string, StatusMeta> = {
  draft: {
    tone: "neutral",
    labelKey: "status.retail.draft",
    nextActor: "admin",
  },
  ready_for_handoff: {
    tone: "info",
    labelKey: "status.retail.ready_for_handoff",
    /** Creation state from storefront — first admin-visible (D40 / addendum). */
    nextActor: "admin",
  },
  handoff_opened: {
    tone: "progress",
    labelKey: "status.retail.handoff_opened",
    nextActor: "admin",
  },
  in_follow_up: {
    tone: "attention",
    labelKey: "status.retail.in_follow_up",
    nextActor: "admin",
  },
  completed: {
    tone: "success",
    labelKey: "status.retail.completed",
    nextActor: "none",
  },
  cancelled: {
    tone: "closed",
    labelKey: "status.retail.cancelled",
    nextActor: "none",
  },
};

export const DEAL_STATUS: Record<string, StatusMeta> = {
  proposed: {
    tone: "info",
    labelKey: "status.deal.proposed",
    nextActor: "admin",
  },
  negotiating: {
    tone: "progress",
    labelKey: "status.deal.negotiating",
    nextActor: "admin", // refine with last actor in helpers below
  },
  accepted: {
    tone: "success",
    labelKey: "status.deal.accepted",
    nextActor: "none",
  },
  rejected: {
    tone: "danger",
    labelKey: "status.deal.rejected",
    nextActor: "none",
  },
  closed: {
    tone: "closed",
    labelKey: "status.deal.closed",
    nextActor: "none",
  },
};

export const WHOLESALE_STATUS: Record<string, StatusMeta> = {
  submitted: {
    tone: "info",
    labelKey: "status.wholesale.submitted",
    nextActor: "admin",
  },
  under_review: {
    tone: "progress",
    labelKey: "status.wholesale.under_review",
    nextActor: "admin",
  },
  quote_provided: {
    tone: "attention",
    labelKey: "status.wholesale.quote_provided",
    nextActor: "trader",
  },
  confirmed: {
    tone: "success",
    labelKey: "status.wholesale.confirmed",
    nextActor: "admin",
  },
  completed: {
    tone: "success",
    labelKey: "status.wholesale.completed",
    nextActor: "none",
  },
  cancelled: {
    tone: "closed",
    labelKey: "status.wholesale.cancelled",
    nextActor: "none",
  },
};

export function dealNextActor(
  status: string,
  lastActorRole?: "trader" | "admin" | null
): NextActor {
  if (status === "proposed") return "admin";
  if (status === "negotiating") {
    if (lastActorRole === "admin") return "trader";
    if (lastActorRole === "trader") return "admin";
    return "admin";
  }
  return DEAL_STATUS[status]?.nextActor ?? "none";
}

export function getStatusMeta(
  domain: "retail" | "deal" | "wholesale",
  value: string
): StatusMeta {
  const table =
    domain === "retail"
      ? RETAIL_STATUS
      : domain === "deal"
        ? DEAL_STATUS
        : WHOLESALE_STATUS;
  return (
    table[value] ?? {
      tone: "neutral",
      labelKey: `status.unknown`,
      nextActor: "none",
    }
  );
}

/**
 * Status values whose table `nextActor` is `admin` (static rows only).
 * For deals in `negotiating`, use `dealNextActor` with the last entry instead.
 */
export function statusesAwaitingAdmin(
  domain: "retail" | "deal" | "wholesale"
): string[] {
  const table =
    domain === "retail"
      ? RETAIL_STATUS
      : domain === "deal"
        ? DEAL_STATUS
        : WHOLESALE_STATUS;
  return Object.entries(table)
    .filter(([, meta]) => meta.nextActor === "admin")
    .map(([value]) => value);
}

export function retailNextActor(status: string): NextActor {
  return getStatusMeta("retail", status).nextActor;
}

export function wholesaleNextActor(status: string): NextActor {
  return getStatusMeta("wholesale", status).nextActor;
}

/**
 * Happy-path status sequences used by StatusStepper.
 * Off-path terminal statuses (cancelled / closed) are not part of the sequence
 * and are rendered as an "ended" step by the stepper.
 */
export const STATUS_SEQUENCE: Record<
  "retail" | "deal" | "wholesale",
  readonly string[]
> = {
  retail: [
    "draft",
    "ready_for_handoff",
    "handoff_opened",
    "in_follow_up",
    "completed",
  ],
  deal: ["proposed", "negotiating", "accepted"],
  wholesale: [
    "submitted",
    "under_review",
    "quote_provided",
    "confirmed",
    "completed",
  ],
};

export function getStatusSequence(
  domain: "retail" | "deal" | "wholesale"
): readonly string[] {
  return STATUS_SEQUENCE[domain];
}
