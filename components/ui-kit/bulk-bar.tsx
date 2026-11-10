import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating bulk-actions bar. Presentational only — pass actions as children.
 * Parent should hide entirely when no bulk server actions exist.
 */
export function BulkBar({
  open,
  countLabel,
  children,
  clearLabel,
  onClear,
  className,
  toolbarLabel,
}: {
  open: boolean;
  /** Already-localized count string, e.g. "3 selected". */
  countLabel: ReactNode;
  children?: ReactNode;
  clearLabel?: string;
  onClear?: () => void;
  className?: string;
  toolbarLabel?: string;
}) {
  return (
    <div className={cn("rad-bulkw", className)}>
      <div
        className={cn("rad-bulk", open && "rad-on")}
        role="toolbar"
        aria-label={toolbarLabel}
        aria-hidden={!open}
      >
        <b>{countLabel}</b>
        {children}
        {onClear ? (
          <button
            type="button"
            className="rad-ib"
            aria-label={clearLabel}
            onClick={onClear}
          >
            <svg
              className="rad-ic"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
