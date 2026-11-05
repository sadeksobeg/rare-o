"use client";

import type { ReactNode } from "react";
import { m } from "motion/react";
import { useMotion } from "@/components/motion/context";
import { enterTransition } from "@/components/motion/presets";
import { cn } from "@/lib/utils";

/**
 * Soft enter for portal main content.
 * Opacity-only — avoids transform so position:fixed children (admin FAB) stay viewport-fixed.
 */
export function PageEnter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { lite, surface } = useMotion();
  const portalSurface = surface === "trader" ? "trader" : "admin";

  return (
    <m.div
      className={cn("ro-portal-page-enter", className)}
      initial={lite ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={enterTransition(portalSurface, lite)}
      data-ro-page-enter={portalSurface}
    >
      {children}
    </m.div>
  );
}

export function PageEnterLiteAware({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <PageEnter className={className}>{children}</PageEnter>;
}

export { exitTransition } from "@/components/motion/presets";
