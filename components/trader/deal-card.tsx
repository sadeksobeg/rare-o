import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ui/status";

/** Interactive record card — press + hover lift. */
export function DealCard({
  href,
  reference,
  title,
  meta,
  tone,
  statusLabel,
  waitingLabel,
  className,
}: {
  href: string;
  reference: string;
  title?: string;
  meta?: string;
  tone: StatusTone;
  statusLabel: string;
  waitingLabel?: string | null;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "ro-portal-card group flex min-h-20 items-center gap-3 border px-4 py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
        className
      )}
    >
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-xs tracking-wide text-ro-muted">
          {reference}
        </span>
        {title ? (
          <span className="font-display block text-base font-semibold leading-snug transition-colors group-hover:text-[var(--ro-plum-900)]">
            {title}
          </span>
        ) : null}
        <span className="flex flex-wrap items-center gap-2">
          <StatusChip tone={tone} label={statusLabel} size="sm" />
          {waitingLabel ? (
            <StatusChip tone="attention" label={waitingLabel} size="sm" />
          ) : null}
          {meta ? <span className="text-xs text-ro-muted">{meta}</span> : null}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-[var(--ro-plum-800)] transition-transform duration-[var(--ro-dur-fast)] group-hover:translate-x-1 group-active:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        aria-hidden
      />
    </Link>
  );
}
