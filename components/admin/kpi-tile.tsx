import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AnimatedValue } from "@/components/portal/animated-value";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** A05 — interactive KPI tile with count-up and press feedback. */
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
  idleLabel: string;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div
        className={cn("ro-portal-kpi border border-ro-border p-4", className)}
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
        "ro-portal-kpi group block border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="ro-type-overline text-[var(--ro-plum-800)]">{label}</p>
        <ChevronLeft
          className="size-4 shrink-0 text-[var(--ro-plum-800)] opacity-0 transition-[opacity,transform] duration-[var(--ro-dur-fast)] group-hover:translate-x-[-2px] group-hover:opacity-100 rtl:rotate-180 rtl:group-hover:translate-x-[2px]"
          aria-hidden
        />
      </div>
      {value === 0 ? (
        <p className="mt-3 text-sm font-medium text-[var(--ro-success-700)]">
          {idleLabel}
        </p>
      ) : (
        <p className="mt-3 font-display text-[2rem] font-semibold leading-none text-ro-ink">
          <AnimatedValue value={value} />
        </p>
      )}
    </Link>
  );
}
