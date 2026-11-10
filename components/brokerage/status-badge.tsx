import { Pill, type PillTone } from "@/components/ui-kit/pill";
import { cn } from "@/lib/utils";

/** One status → one pill tone across kanban / header / brief / table. */
export function brokeragePillTone(status: string): PillTone {
  if (["CLOSED", "DELIVERED", "PURCHASED", "APPROVED", "PAYMENT_CONFIRMED"].includes(status)) {
    return "ok";
  }
  if (["CANCELLED", "DECLINED", "REJECTED"].includes(status)) return "err";
  if (
    ["AWAITING_PAYMENT", "QUOTE_SENT", "SUBMITTED", "NEEDS_INFO"].includes(status)
  ) {
    return "warn";
  }
  return "info";
}

export function BrokerageStatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  return (
    <span data-ro-brokerage-status={status} className={cn("inline-flex", className)}>
      <Pill tone={brokeragePillTone(status)}>{label}</Pill>
    </span>
  );
}
