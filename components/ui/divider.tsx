"use client";

import { useId } from "react";
import { Grain } from "@/components/brand";
import { cn } from "@/lib/utils";

export type DividerVariant = "hairline" | "grain" | "axis";

/** P24 — hairline / grain (24 px, 8% opacity) / axis (48 px vertical). */
export function Divider({
  variant = "hairline",
  className,
}: {
  variant?: DividerVariant;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");

  if (variant === "axis") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block w-px shrink-0 self-stretch bg-current opacity-40",
          "min-h-12",
          className
        )}
      />
    );
  }

  if (variant === "grain") {
    return (
      <div
        aria-hidden
        className={cn(
          "relative h-6 w-full overflow-hidden text-ro-ink",
          className
        )}
      >
        <Grain className="absolute inset-0" opacity={0.08} patternId={`ro-div-grain-${uid}`} />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        "m-0 h-px w-full border-0 bg-[var(--ro-border-subtle)]",
        className
      )}
    />
  );
}
