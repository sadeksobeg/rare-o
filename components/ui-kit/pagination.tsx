import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function pageWindow(page: number, pageCount: number, max = 5): number[] {
  if (pageCount <= max) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const half = Math.floor(max / 2);
  let start = Math.max(1, page - half);
  let end = start + max - 1;
  if (end > pageCount) {
    end = pageCount;
    start = end - max + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * List footer pagination — summary + numbered pages + prev/next.
 * Labels are props (dictionary i18n at call site).
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  getPageHref,
  summary,
  previousLabel,
  nextLabel,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  getPageHref?: (page: number) => string;
  /** Already-localized summary, e.g. "Showing 1–8 of 19". */
  summary?: ReactNode;
  previousLabel: string;
  nextLabel: string;
  className?: string;
}) {
  const safeCount = Math.max(1, pageCount);
  const safePage = Math.min(Math.max(1, page), safeCount);
  const pages = pageWindow(safePage, safeCount);
  const atStart = safePage <= 1;
  const atEnd = safePage >= safeCount;

  const go = (p: number) => {
    if (p < 1 || p > safeCount || p === safePage) return;
    onPageChange?.(p);
  };

  const PrevIcon = (
    <ChevronLeft className="rtl:-scale-x-100" width={16} height={16} strokeWidth={1.5} aria-hidden />
  );
  const NextIcon = (
    <ChevronRight className="rtl:-scale-x-100" width={16} height={16} strokeWidth={1.5} aria-hidden />
  );

  return (
    <nav className={cn("rad-pgn", className)} aria-label={typeof summary === "string" ? summary : undefined}>
      {summary != null ? <span>{summary}</span> : <span />}
      <div className="rad-pp">
        {getPageHref && !atStart ? (
          <a href={getPageHref(safePage - 1)} aria-label={previousLabel}>
            {PrevIcon}
          </a>
        ) : (
          <button
            type="button"
            aria-label={previousLabel}
            disabled={atStart}
            onClick={() => go(safePage - 1)}
          >
            {PrevIcon}
          </button>
        )}
        {pages.map((p) =>
          getPageHref ? (
            <a
              key={p}
              href={getPageHref(p)}
              className={cn(p === safePage && "rad-on")}
              aria-current={p === safePage ? "page" : undefined}
            >
              {p}
            </a>
          ) : (
            <button
              key={p}
              type="button"
              className={cn(p === safePage && "rad-on")}
              aria-current={p === safePage ? "page" : undefined}
              onClick={() => go(p)}
            >
              {p}
            </button>
          )
        )}
        {getPageHref && !atEnd ? (
          <a href={getPageHref(safePage + 1)} aria-label={nextLabel}>
            {NextIcon}
          </a>
        ) : (
          <button
            type="button"
            aria-label={nextLabel}
            disabled={atEnd}
            onClick={() => go(safePage + 1)}
          >
            {NextIcon}
          </button>
        )}
      </div>
    </nav>
  );
}
