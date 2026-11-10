import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Two-column detail grid used by admin detail headers (div-based for axe). */
export function DetailList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ro-portal-card grid gap-4 border p-4 text-sm md:grid-cols-2 md:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DetailItem({
  label,
  children,
  icon,
  className,
}: {
  label: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      {icon ? (
        <span className="ro-portal-icon-well size-8 [&>svg]:size-3.5" aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-wide text-ro-muted">{label}</p>
        <div className="mt-0.5 text-[0.9375rem] font-semibold text-ro-ink">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Section heading + body used for stacked admin detail blocks. */
export function DetailSection({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="ro-portal-section-title flex items-center gap-2">
        {icon ? (
          <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
            {icon}
          </span>
        ) : null}
        {title}
      </h2>
      {children}
    </div>
  );
}
