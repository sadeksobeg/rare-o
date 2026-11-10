"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type RadKpiTone = "ac" | "ok" | "warn" | "info" | "err";

function useCountUp(value: number, active: boolean) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }
    const t0 = performance.now();
    const duration = 900;
    let frame: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduce, value]);

  return display;
}

export function RadKpiCard({
  icon,
  tone,
  label,
  value,
  delta,
  deltaCaption,
  idleLabel,
  sparkline,
  style,
}: {
  icon: ReactNode;
  tone: RadKpiTone;
  label: string;
  value: number;
  /** Signed delta vs. yesterday; omit when there's no comparable series. */
  delta?: { direction: "up" | "down" | "flat"; label: string } | null;
  deltaCaption?: string | null;
  idleLabel: string;
  /** >=7 points required to actually render bars (dataviz rule). */
  sparkline?: number[];
  style?: React.CSSProperties;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const display = useCountUp(value, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const showSpark = Boolean(sparkline && sparkline.length >= 7);
  const max = showSpark ? Math.max(...sparkline!, 1) : 1;

  return (
    <article ref={ref} className="rad-card rad-kpi rad-rise" style={style}>
      <div className="rad-kh">
        <span className={cn("rad-chip", `rad-c-${tone}`)}>{icon}</span>
        {label}
      </div>
      <div className="rad-kb">
        <div>
          <div className={cn("rad-big rad-num", value === 0 && "rad-z")}>
            {display}
          </div>
          {value === 0 ? (
            <div className="rad-calm">
              <CircleCheck width={16} height={16} strokeWidth={1.5} aria-hidden />
              {idleLabel}
            </div>
          ) : delta ? (
            <div className={cn("rad-delta", `rad-${delta.direction === "up" ? "up" : delta.direction === "down" ? "dn" : "flat"}`)}>
              <bdi dir="ltr">{delta.label}</bdi>
            </div>
          ) : null}
        </div>
        {showSpark ? (
          <div className="rad-spark" aria-hidden>
            {sparkline!.map((v, i) => (
              <i
                key={i}
                style={
                  {
                    "--rad-h": `${Math.max(8, (v / max) * 100)}%`,
                    "--rad-d": i,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ) : null}
      </div>
      {delta && value !== 0 && deltaCaption ? (
        <div className="rad-kf">
          <span>{deltaCaption}</span>
        </div>
      ) : null}
    </article>
  );
}
