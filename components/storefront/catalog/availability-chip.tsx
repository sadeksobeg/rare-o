import { StatusChip } from "@/components/ui/status-chip";

/** S10 — shown only when unavailable; available is the unmarked default. */
export function AvailabilityChip({
  availability,
  label,
  size = "sm",
  className,
}: {
  availability: string | null | undefined;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  if (availability !== "unavailable") return null;
  return (
    <StatusChip tone="closed" label={label} size={size} className={className} />
  );
}
