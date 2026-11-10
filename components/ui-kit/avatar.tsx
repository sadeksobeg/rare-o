import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AvatarGradient = "" | "g2" | "g3" | "g4" | "g5";

const GRADIENT_CLASS: Record<Exclude<AvatarGradient, "">, string> = {
  g2: "rad-g2",
  g3: "rad-g3",
  g4: "rad-g4",
  g5: "rad-g5",
};

/** Presentational avatar — pass initials or a lucide icon as children. */
export function Avatar({
  size = "md",
  gradient = "",
  children,
  className,
  title,
}: {
  size?: "sm" | "md" | "lg";
  gradient?: AvatarGradient;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "rad-uk-avt",
        size === "sm" && "rad-sm",
        size === "lg" && "rad-lg",
        gradient && GRADIENT_CLASS[gradient],
        className
      )}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {children}
    </span>
  );
}
