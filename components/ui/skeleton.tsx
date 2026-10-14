import { cn } from "@/lib/utils";

/** P12 — sand-300 base, 1.4 s shimmer; static under reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("ro-skeleton rounded-[var(--ro-r-sm)]", className)}
      aria-hidden
    />
  );
}
