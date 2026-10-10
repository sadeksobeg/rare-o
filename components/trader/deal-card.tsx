import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/ui/status";

/** Mobile-first record card for trader deal / wholesale lists. */
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
        "group flex min-h-20 items-center gap-3 border border-ro-line bg-ro-surface px-4 py-3 transition-colors hover:border-ro-ink/35",
        className
      )}
    >
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-xs text-ro-muted">{reference}</span>
        {title ? (
          <span className="font-display block text-base font-semibold leading-snug">
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
        className="size-5 shrink-0 text-ro-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
