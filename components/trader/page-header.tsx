import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Trader page chrome — title + lead + action (non-home routes). */
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
        "mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--rad-bd)] pb-6",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="rad-chip rad-c-ac mt-1 hidden sm:inline-grid [&>svg]:size-5">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 space-y-2">
          {backHref && backLabel ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--rad-ac)] hover:underline"
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
            <p className="text-[11px] font-bold tracking-[0.08em] text-[color:var(--rad-ac)]">
              {overline}
            </p>
          ) : null}
          <h1
            className="text-3xl font-semibold tracking-tight text-[color:var(--rad-tx)] sm:text-[2.15rem]"
            style={{ fontFamily: "var(--rad-font, inherit)" }}
          >
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl leading-relaxed text-[color:var(--rad-tx2)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
