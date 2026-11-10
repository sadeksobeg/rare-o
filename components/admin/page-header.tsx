import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Admin list/detail page header: display title, optional lead, optional action. */
export function PageHeader({
  title,
  description,
  overline,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  overline?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ro-portal-main-enter flex flex-wrap items-end justify-between gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_16%,transparent)] pb-5",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="ro-portal-icon-well mt-1 hidden sm:inline-flex [&>svg]:size-5">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 space-y-1.5">
          {overline ? (
            <p className="ro-type-overline font-bold text-[var(--ro-plum-800)]">
              {overline}
            </p>
          ) : null}
          <h1 className="ro-portal-page-title text-3xl tracking-tight sm:text-[2rem]">
            {title}
          </h1>
          {description ? (
            <p className="ro-portal-muted max-w-2xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
