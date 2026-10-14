import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: readonly BreadcrumbItem[];
  /** Accessible name for the nav. */
  label: string;
  /** Mobile collapse: back link label (defaults to previous crumb). */
  backLabel?: string;
  className?: string;
};

/** P16 — chevron mirrored in RTL; last = aria-current; mobile → back link. */
export function Breadcrumb({ items, label, backLabel, className }: Props) {
  if (!items.length) return null;

  const last = items[items.length - 1]!;
  const parent = items.length > 1 ? items[items.length - 2] : undefined;

  return (
    <nav aria-label={label} className={cn("text-sm", className)}>
      {/* Mobile: collapse to back */}
      {parent?.href ? (
        <Link
          href={parent.href}
          className="inline-flex items-center gap-1 text-ro-text-2 hover:text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)] md:hidden"
        >
          <ChevronLeft
            className="size-4 rtl:hidden"
            strokeWidth={1.5}
            aria-hidden
          />
          <ChevronRight
            className="hidden size-4 rtl:inline"
            strokeWidth={1.5}
            aria-hidden
          />
          {backLabel ?? parent.label}
        </Link>
      ) : (
        <span className="text-ro-muted md:hidden">{last.label}</span>
      )}

      <ol className="hidden flex-wrap items-center gap-1 md:flex">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 ? (
                <ChevronLeft
                  className="hidden size-3.5 text-ro-muted rtl:inline"
                  strokeWidth={1.5}
                  aria-hidden
                />
              ) : null}
              {i > 0 ? (
                <ChevronRight
                  className="size-3.5 text-ro-muted rtl:hidden"
                  strokeWidth={1.5}
                  aria-hidden
                />
              ) : null}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    isLast ? "font-medium text-ro-ink" : "text-ro-muted"
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-ro-text-2 hover:text-ro-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
