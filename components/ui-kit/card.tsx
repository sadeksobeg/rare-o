import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Surface card shell (`.rad-card`). */
export function Card({
  children,
  className,
  padded,
  style,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  /** Zero outer padding — use with CardHeader + body padding helpers. */
  padded?: boolean;
  style?: CSSProperties;
  "aria-label"?: string;
}) {
  return (
    <section
      className={cn("rad-card", padded === false && "rad-cpad", className)}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}

/** Card header row — title / count / trailing actions (seg, density, …). */
export function CardHeader({
  title,
  count,
  children,
  actions,
  className,
}: {
  title?: ReactNode;
  count?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rad-ch", className)}>
      {title != null ? (
        <h2>
          {title}
          {count != null ? <span className="rad-cnt rad-num">{count}</span> : null}
        </h2>
      ) : null}
      {children}
      {actions}
    </div>
  );
}
