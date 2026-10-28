import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Trader page chrome — display title + lead + action, never bare h1. */
export function TraderPageHeader({
  title,
  description,
  overline = "RARE OUD",
  action,
  icon,
  backHref,
  backLabel,
  className,
}: {
  title: string;
  description?: string;
  overline?: string;
  action?: ReactNode;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "ro-portal-main-enter flex flex-wrap items-end justify-between gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_18%,transparent)] pb-6",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="ro-portal-icon-well mt-1 hidden sm:inline-flex [&>svg]:size-5">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 space-y-2">
          {backHref && backLabel ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ro-plum-900)] hover:underline"
            >
              <ArrowLeft
                className="size-4 rtl:-scale-x-100"
                strokeWidth={1.5}
                aria-hidden
              />
              {backLabel}
            </Link>
          ) : null}
          {overline ? (
            <p className="ro-type-overline font-bold text-[var(--ro-plum-800)]">
              {overline}
            </p>
          ) : null}
          <h1 className="ro-portal-page-title text-3xl tracking-tight sm:text-[2.15rem]">
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
    </header>
  );
}
