"use client";

import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { portalStagger } from "@/components/motion/presets";
import { cn } from "@/lib/utils";

/**
 * Unified home-page choreography — one stagger tree for Command Center layers.
 * Transform + opacity only; Lite skips offset.
 */
export function DashboardStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const lite = Boolean(reduce);

  return (
    <m.div
      className={cn("flex w-full flex-col", className)}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: lite
            ? { staggerChildren: 0 }
            : {
                staggerChildren: portalStagger.staggerChildren,
                delayChildren: 0.02,
              },
        },
      }}
    >
      {children}
    </m.div>
  );
}

export function DashboardSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const lite = Boolean(reduce);

  return (
    <m.section
      className={cn(className)}
      variants={{
        hidden: lite ? { opacity: 1 } : { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: lite ? 0.14 : 0.28,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      }}
    >
      {children}
    </m.section>
  );
}
