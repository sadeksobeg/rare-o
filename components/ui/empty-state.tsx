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
        "rad-card flex flex-col items-center px-6 py-10 text-center",
        className
      )}
      data-variant={variant}
      data-empty="1"
    >
      <div
        className={cn(
          "mb-6 text-[color:var(--rad-ac,var(--ro-plum-800))]",
          large
            ? ""
            : "inline-flex size-14 items-center justify-center rounded-[11px] bg-[color:var(--rad-surface3)] text-[color:var(--rad-tx2)] [&>svg]:size-7"
        )}
      >
        {mark}
      </div>
      <h3 className="text-balance text-lg font-semibold text-[color:var(--rad-tx)]">
        {title}
      </h3>
      {body ? (
        <p className="mt-2.5 max-w-lg text-pretty text-sm leading-relaxed text-[color:var(--rad-tx3)]">
          {body}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} className="mt-8 min-w-[10rem]">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
}
