import { cn } from "@/lib/utils";

/** Admin list/detail page header: display title, optional lead, optional action. */
export function PageHeader({
  title,
  description,
  overline,
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
    <div
      className={cn(
        "ro-portal-main-enter flex flex-wrap items-end justify-between gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_16%,transparent)] pb-5",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {overline ? (
          <p className="ro-type-overline text-[var(--ro-plum-800)]">{overline}</p>
        ) : null}
        <h1 className="ro-portal-page-title text-3xl tracking-tight sm:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ro-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
