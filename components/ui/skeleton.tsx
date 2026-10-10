import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--ro-r-sm)] bg-[var(--ro-sand-300)]",
        className
      )}
      aria-hidden
    />
  );
}
