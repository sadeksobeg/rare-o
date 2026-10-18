import { cn } from "@/lib/utils";

/** Trader page chrome — display title + lead + action, never bare h1. */
export function TraderPageHeader({
  title,
  description,
  overline = "RARE OUD",
  action,
  className,
}: {
  title: string;
  description?: string;
  overline?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "ro-portal-main-enter flex flex-wrap items-end justify-between gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_18%,transparent)] pb-6",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {overline ? (
          <p className="ro-type-overline text-[var(--ro-plum-800)]">{overline}</p>
        ) : null}
        <h1 className="ro-portal-page-title text-3xl tracking-tight sm:text-[2.15rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ro-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
