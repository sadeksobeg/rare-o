import { Rings } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "first-use" | "no-results" | "restricted";

/** P13 — Rings 96 px @ 28%; variants first-use / no-results / restricted. */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  variant = "no-results",
  className,
}: {
  title: string;
  body?: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: EmptyStateVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-16 text-center",
        className
      )}
      data-variant={variant}
    >
      <Rings
        className="mb-6 size-24 text-ro-ink opacity-[0.28]"
        idle
      />
      <h3 className="text-lg font-semibold text-ro-ink">{title}</h3>
      {body ? (
        <p className="mt-2 line-clamp-2 max-w-md text-sm text-ro-text-2">
          {body}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-6">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
