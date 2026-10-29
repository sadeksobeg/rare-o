import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  SUBMITTED: "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
  NEEDS_INFO: "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  ACCEPTED: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  INSPECTION_SCHEDULED: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  INSPECTED: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  QUOTE_SENT: "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  APPROVED: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  PURCHASED: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  SHIPPED: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  DELIVERED: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  CLOSED: "bg-[var(--ro-sand-300)] text-[var(--ro-ink-600)]",
  DECLINED: "bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  REJECTED: "bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  CANCELLED: "bg-[var(--ro-sand-300)] text-[var(--ro-ink-600)]",
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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/5",
        TONE[status] ?? TONE.SUBMITTED,
        className
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
      />
      {label}
    </span>
  );
}
