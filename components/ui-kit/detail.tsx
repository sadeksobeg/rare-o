"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, type PillTone } from "./pill";

/** Back link above detail header. */
export function DetailBack({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("rad-back", className)}>
      <ChevronLeft
        width={14}
        height={14}
        strokeWidth={1.5}
        className="rtl:-scale-x-100"
        aria-hidden
      />
      {children}
    </Link>
  );
}

/** Reference + status pill + meta line + action cluster. */
export function DetailHeader({
  reference,
  status,
  statusTone = "new",
  meta,
  actions,
  className,
  mono = true,
}: {
  reference: ReactNode;
  status?: ReactNode;
  statusTone?: PillTone;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Wrap reference in `.rad-mono` (refs/ids). Off for person names. */
  mono?: boolean;
}) {
  const hasActions = actions != null;
  return (
    <div
      className={cn(
        "rad-dh",
        !hasActions && "rad-dh-noact",
        className
      )}
    >
      <div>
        <h1>
          {mono ? (
            <span className="rad-mono">{reference}</span>
          ) : (
            <span>{reference}</span>
          )}
          {status != null ? <Pill tone={statusTone}>{status}</Pill> : null}
        </h1>
        {meta != null ? <div className="rad-dh-meta">{meta}</div> : null}
      </div>
      {hasActions ? <div className="rad-pact">{actions}</div> : null}
    </div>
  );
}

export function DetailGrid({
  main,
  rail,
  className,
}: {
  main: ReactNode;
  rail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rad-dgrid", className)}>
      <div className="rad-stack">{main}</div>
      {rail != null ? <aside className="rad-stack">{rail}</aside> : null}
    </div>
  );
}

export type DetailStepState = "done" | "current" | "upcoming" | "blocked";

export type DetailStep = {
  value: string;
  label: ReactNode;
  state: DetailStepState;
};

/** Horizontal lifecycle stepper matching admin-detail.html `.stp`. */
export function DetailStepper({
  steps,
  "aria-label": ariaLabel,
  className,
}: {
  steps: DetailStep[];
  "aria-label": string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cur = root.querySelector<HTMLElement>('[aria-current="step"]');
    cur?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [steps]);

  return (
    <div
      className={cn("rad-stp-scroll", className)}
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
    >
      <div
        ref={rootRef}
        className="rad-stp"
        role="list"
        aria-label={ariaLabel}
        data-progress={`${Math.max(
          1,
          steps.findIndex((s) => s.state === "current" || s.state === "blocked") + 1
        )}/${steps.length}`}
      >
        {steps.map((step, i) => (
          <div
            key={`${step.value}-${i}`}
            role="listitem"
            aria-current={step.state === "current" ? "step" : undefined}
            className={cn(
              "rad-s",
              step.state === "done" && "rad-done",
              step.state === "current" && "rad-cur",
              step.state === "blocked" && "rad-blocked"
            )}
          >
            <span className="rad-n">
              {step.state === "done" ? (
                <Check width={15} height={15} strokeWidth={1.5} aria-hidden />
              ) : (
                i + 1
              )}
            </span>
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyValue({
  items,
  className,
}: {
  items: { label: ReactNode; value: ReactNode; full?: boolean; nowrap?: boolean }[];
  className?: string;
}) {
  return (
    <dl className={cn("rad-kv", className)}>
      {items.map((item, i) => (
        <div key={i} className={item.full ? "rad-full" : undefined}>
          <dt>{item.label}</dt>
          <dd className={item.nowrap ? "rad-nowrap" : undefined}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function LineItem({
  thumb,
  title,
  subtitle,
  price,
}: {
  thumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  price?: ReactNode;
}) {
  return (
    <div className="rad-it">
      {thumb}
      <div className="rad-tt">
        <b>{title}</b>
        {subtitle != null ? <span>{subtitle}</span> : null}
      </div>
      {price != null ? <div className="rad-pr">{price}</div> : null}
    </div>
  );
}

export function Timeline({
  events,
  className,
}: {
  events: { icon?: ReactNode; title: ReactNode; meta?: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("rad-tl", className)}>
      {events.map((ev, i) => (
        <div
          key={i}
          className="rad-ev"
          style={{ ["--rad-i" as string]: String(i) }}
        >
          <span className="rad-chip rad-c-ac">{ev.icon}</span>
          <div>
            <b>{ev.title}</b>
            {ev.meta != null ? (
              <span className="rad-nowrap">{ev.meta}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PayNote({
  children,
  ok,
  icon,
}: {
  children: ReactNode;
  ok?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className={cn("rad-paynote", ok && "rad-ok")}>
      {icon}
      <div>{children}</div>
    </div>
  );
}
