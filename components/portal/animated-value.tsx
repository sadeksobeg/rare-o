"use client";

import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

/** Count-up for portal KPIs — delegates to motion CountUp (admin cap 200ms). */
export function AnimatedValue({
  value,
  className,
  durationMs = 700,
}: {
  value: number;
  className?: string;
  durationMs?: number;
}) {
  return (
    <CountUp value={value} durationMs={durationMs} className={cn(className)} />
  );
}
