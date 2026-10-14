import { Rings } from "@/components/brand";
import { cn } from "@/lib/utils";

/** P22 — three-ring pulse motif; sizes 24 / 40. */
export function Loader({
  size = 40,
  className,
  label,
}: {
  size?: 24 | 40;
  className?: string;
  /** Accessible name; omit for decorative (e.g. inside aria-busy button). */
  label?: string;
}) {
  const decorative = label === "";
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      role={decorative ? undefined : "status"}
      aria-label={decorative ? undefined : label || "Loading"}
      aria-hidden={decorative || undefined}
    >
      <Rings
        className={cn(
          "text-ro-plum opacity-70",
          size === 24 ? "size-6" : "size-10"
        )}
        idle
      />
    </span>
  );
}
