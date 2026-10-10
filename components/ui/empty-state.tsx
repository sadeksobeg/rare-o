import { Rings } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  className,
}: {
  title: string;
  body?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-16 text-center",
        className
      )}
    >
      <Rings className="mb-6 h-24 w-24 text-ro-ink opacity-30" />
      <h3 className="text-lg font-semibold text-ro-ink">{title}</h3>
      {body ? (
        <p className="mt-2 max-w-md text-sm text-ro-text-2">{body}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-6">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
