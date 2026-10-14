import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";

type Props = {
  page: number;
  pageCount: number;
  /** Localized "page {page} of {pageCount}" already formatted. */
  pageOfLabel: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious?: () => void;
  onNext?: () => void;
  previousHref?: string;
  nextHref?: string;
  className?: string;
};

/** P15 — previous / next + "page x of y"; 44 px targets. */
export function Pagination({
  page,
  pageCount,
  pageOfLabel,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
  previousHref,
  nextHref,
  className,
}: Props) {
  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <nav
      aria-label={pageOfLabel}
      className={cn("flex items-center justify-center gap-3", className)}
    >
      {previousHref && !atStart ? (
        <a
          href={previousHref}
          aria-label={previousLabel}
          className="inline-flex size-11 items-center justify-center rounded-[var(--ro-r-sm)] text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        >
          <ChevronLeft className="size-5 rtl:-scale-x-100" strokeWidth={1.5} />
        </a>
      ) : (
        <IconButton
          label={previousLabel}
          size="md"
          variant="quiet"
          disabled={atStart}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-5 rtl:-scale-x-100" strokeWidth={1.5} />
        </IconButton>
      )}
      <p className="min-w-[7rem] text-center text-sm tabular-nums text-ro-text-2">
        {pageOfLabel}
      </p>
      {nextHref && !atEnd ? (
        <a
          href={nextHref}
          aria-label={nextLabel}
          className="inline-flex size-11 items-center justify-center rounded-[var(--ro-r-sm)] text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        >
          <ChevronRight className="size-5 rtl:-scale-x-100" strokeWidth={1.5} />
        </a>
      ) : (
        <IconButton
          label={nextLabel}
          size="md"
          variant="quiet"
          disabled={atEnd}
          onClick={onNext}
        >
          <ChevronRight className="size-5 rtl:-scale-x-100" strokeWidth={1.5} />
        </IconButton>
      )}
    </nav>
  );
}
