import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A05 — label, big tabular number, link to filtered list; loading / zero / populated. */
export function KpiTile({
  label,
  value,
  href,
  idleLabel,
  loading = false,
  className,
}: {
  label: string;
  value: number;
  href: string;
  /** Zero-state copy — e.g. لا شيء بانتظارك (success tone). */
  idleLabel: string;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div
        className={cn(
          "border border-ro-border bg-ro-paper p-4",
          className
        )}
        aria-busy="true"
        aria-label={label}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-16" />
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "block border border-ro-border bg-ro-paper p-4 transition-colors duration-[var(--ro-dur-fast)] hover:border-ro-ink/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        className
      )}
    >
      <p className="text-xs text-ro-muted">{label}</p>
      {value === 0 ? (
        <p className="mt-2 text-sm font-medium text-[var(--ro-success-700)]">
          {idleLabel}
        </p>
      ) : (
        <p className="mt-2 text-[28px] font-semibold tabular-nums leading-none text-ro-ink">
          {value}
        </p>
      )}
    </Link>
  );
}
