import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "first-use" | "no-results" | "restricted";

const variantIcon: Record<EmptyStateVariant, ReactNode> = {
  "first-use": (
    <DrawIn durationMs={900} className="size-24">
      <RosetteMark width={96} height={96} />
    </DrawIn>
  ),
  "no-results": (
    <DrawIn durationMs={900} className="size-24">
      <RosetteMark width={96} height={96} />
    </DrawIn>
  ),
  restricted: <ShieldOff className="size-7" strokeWidth={1.5} aria-hidden />,
};

/** P13 — rings illustration; variants first-use / no-results / restricted. */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  variant = "no-results",
  icon,
  className,
}: {
  title: string;
  body?: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: EmptyStateVariant;
  icon?: ReactNode;
  className?: string;
}) {
  const mark = icon ?? variantIcon[variant];
  const large = !icon && variant !== "restricted";

  return (
    <div
      className={cn(
        "ro-portal-card flex flex-col items-center border px-6 py-16 text-center",
        className
      )}
      data-variant={variant}
    >
      <div
        className={cn(
          "mb-6 text-[var(--ro-plum-800)]",
          large ? "" : "ro-portal-icon-well size-14 [&>svg]:size-7"
        )}
      >
        {mark}
      </div>
      <h3 className="ro-portal-section-title">{title}</h3>
      {body ? (
        <p className="ro-portal-muted mt-2 line-clamp-2 max-w-md">{body}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-6">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
