import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  SUBMITTED: "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
  NEEDS_INFO: "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  AWAITING_PAYMENT: "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  PAYMENT_CONFIRMED: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  ACCEPTED: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  INSPECTION_SCHEDULED: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  INSPECTED: "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
  QUOTE_SENT: "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  APPROVED: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  PURCHASED: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  SHIPPED: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  DELIVERED: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  CLOSED: "bg-[color:color-mix(in_srgb,var(--ro-text)_10%,transparent)] text-[color:var(--ro-text-2)]",
  DECLINED: "bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  REJECTED: "bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  CANCELLED: "bg-[color:color-mix(in_srgb,var(--ro-text)_10%,transparent)] text-[color:var(--ro-text-2)]",
};

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
    <span
      data-ro-brokerage-status={status}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium leading-none ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--ro-text)_8%,transparent)]",
        TONE[status] ?? TONE.SUBMITTED,
        className
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
