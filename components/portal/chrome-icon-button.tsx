"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ChromeTone = "default" | "on-dark";

/**
 * Linear-grade header icon control.
 * CSS-only hover (no motion import) — safe for shell/login isolation.
 * Children may include an absolute badge; glyph class is optional via wrapGlyph.
 */
export function ChromeIconButton({
  children,
  className,
  tone = "default",
  href,
  wrapGlyph = true,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: ChromeTone;
  href?: string;
  wrapGlyph?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">) {
  const classes = cn(
    "ro-chrome-icon",
    tone === "on-dark" && "ro-chrome-icon--on-dark",
    className
  );

  const body = wrapGlyph ? (
    <span className="ro-chrome-icon-glyph">{children}</span>
  ) : (
    children
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={rest["aria-label"]}>
        {body}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {body}
    </button>
  );
}

export function ChromeActionCluster({
  children,
  className,
  onDark = false,
}: {
  children: ReactNode;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={cn(
        "ro-chrome-cluster",
        onDark && "ro-chrome-cluster--on-dark",
        className
      )}
    >
      {children}
    </div>
  );
}
