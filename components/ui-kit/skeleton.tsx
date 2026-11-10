import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Shimmer skeleton — circle variant via `circle`. Static under reduced motion (CSS). */
export function Skeleton({
  className,
  circle,
  style,
}: {
  className?: string;
  circle?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn("rad-sk", circle && "rad-c", className)}
      style={style}
      aria-hidden
    />
  );
}
