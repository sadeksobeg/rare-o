"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";

/** S10 — badge that counts in and pulses once when the number changes. */
export function LiveBadge({
  value,
  className,
  max = 9,
}: {
  value: number;
  className?: string;
  max?: number;
}) {
  const prev = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 420);
    return () => window.clearTimeout(t);
  }, [value]);

  if (value <= 0) return null;

  return (
    <span className={cn(pulse && "ro-badge-pulse", className)}>
      {value > max ? (
        `${max}+`
      ) : (
        <CountUp value={value} durationMs={200} />
      )}
    </span>
  );
}
