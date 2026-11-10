import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function BreathingRings({
  size = 96,
  icon,
}: {
  size?: number;
  icon?: ReactNode;
}) {
  return (
    <div className={size >= 140 ? "rad-rg" : "rad-rg2"} style={size >= 140 ? undefined : undefined}>
      <svg
        className={size >= 140 ? undefined : "rad-r"}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        stroke="currentColor"
        aria-hidden
      >
        <circle cx={size / 2} cy={size / 2} r={size * 0.167} />
        <circle cx={size / 2} cy={size / 2} r={size * 0.312} />
        <circle cx={size / 2} cy={size / 2} r={size * 0.458} />
      </svg>
      {icon ? (size >= 140 ? <i>{icon}</i> : icon) : null}
    </div>
  );
}

/** First-use empty — breathing rings + optional action slot (labels as props). */
export function EmptyState({
  title,
  body,
  icon,
  action,
  large,
  className,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Use full `.rad-ept` layout (150px rings). */
  large?: boolean;
  className?: string;
}) {
  if (large) {
    return (
      <div className={cn("rad-ept", className)}>
        <BreathingRings size={150} icon={icon} />
        <b>{title}</b>
        {body ? <p>{body}</p> : null}
        {action}
      </div>
    );
  }

  return (
    <div className={cn("rad-nores", className)}>
      <BreathingRings size={96} icon={icon} />
      <b>{title}</b>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

/** Filtered no-results — same breathing rings chrome as EmptyState. */
export function NoResults({
  title,
  body,
  icon,
  action,
  className,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <EmptyState
      title={title}
      body={body}
      icon={icon}
      action={action}
      className={className}
    />
  );
}
