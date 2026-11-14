/**
 * The customer-facing journey of a retail request, derived from real state
 * (request status + customer answer + shipment). Pure — used by the success
 * page, the order page and tests.
 */
export type JourneyStepState = "done" | "active" | "pending" | "alert";

export type JourneyStep = {
  key: "received" | "whatsapp" | "confirm" | "prepare" | "ship" | "deliver";
  state: JourneyStepState;
};

export type JourneyInput = {
  status: string;
  response: "confirmed" | "changes_requested" | null;
  shipmentStatus?: string | null;
};

const SHIPPED = new Set(["HANDED_OVER", "IN_TRANSIT", "ARRIVED"]);

export function computeJourney(input: JourneyInput): {
  steps: JourneyStep[];
  cancelled: boolean;
  activeIndex: number;
} {
  const cancelled = input.status === "cancelled";
  const chatStarted = ["handoff_opened", "in_follow_up", "completed"].includes(input.status);
  const confirmed = input.response === "confirmed";
  const hasShipment = !!input.shipmentStatus && input.shipmentStatus !== "CANCELLED";
  const shipped = !!input.shipmentStatus && SHIPPED.has(input.shipmentStatus);
  const delivered = input.status === "completed" || input.shipmentStatus === "DELIVERED";

  const done = {
    received: true,
    whatsapp: chatStarted,
    confirm: confirmed || delivered,
    prepare: hasShipment || delivered,
    ship: shipped || delivered,
    deliver: delivered,
  } as const;

  const order: JourneyStep["key"][] = ["received", "whatsapp", "confirm", "prepare", "ship", "deliver"];
  let activeIndex = order.findIndex((k) => !done[k]);
  if (activeIndex === -1) activeIndex = order.length - 1;

  const steps: JourneyStep[] = order.map((key, i) => {
    let state: JourneyStepState = done[key] ? "done" : i === activeIndex ? "active" : "pending";
    if (key === "confirm" && input.response === "changes_requested" && !done.confirm) state = "alert";
    if (cancelled && !done[key]) state = "pending";
    return { key, state };
  });
  return { steps, cancelled, activeIndex: cancelled ? -1 : activeIndex };
}
