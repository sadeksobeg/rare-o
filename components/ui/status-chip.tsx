import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  getStatusChipProps,
  type StatusDomain,
} from "@/lib/ui/status-labels";
import type { StatusTone } from "@/lib/ui/status";

const toneClass: Record<StatusTone, string> = {
  neutral: "bg-[var(--ro-sand-300)] text-[var(--ro-ink-600)]",
  info: "bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
  progress: "bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  attention: "bg-[var(--ro-amber-100)] text-[var(--ro-amber-800)]",
  success: "bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  danger: "bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  closed: "bg-[#E6E0EA] text-[var(--ro-ink-500)]",
};

type BoundProps = {
  domain: StatusDomain;
  value: string;
  dict: Dictionary;
  tone?: never;
  label?: never;
};

type FreeProps = {
  /** Prefer domain+value+dict so tone/label come from `lib/ui/status.ts`. */
  tone: StatusTone;
  label: string;
  domain?: never;
  value?: never;
  dict?: never;
};

type Common = {
  icon?: React.ReactNode;
  size?: "sm" | "md";
  /** Dense tables: tone dot only + label. */
  variant?: "default" | "dot";
  className?: string;
};

/**
 * P06 — tone + label from approved status mapping when `domain`/`value`/`dict`
 * are provided (`lib/ui/status.ts` via status-labels). Free tone/label only for
 * non-lifecycle entities (product/promo).
 */
export function StatusChip(props: (BoundProps | FreeProps) & Common) {
  const { icon, size = "md", variant = "default", className } = props;

  const resolved =
    "domain" in props && props.domain != null
      ? getStatusChipProps(props.dict, props.domain, props.value)
      : { tone: props.tone, label: props.label };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--ro-r-sm)] font-medium",
        size === "sm" ? "h-[22px] px-2 text-xs" : "h-7 px-2.5 text-xs",
        toneClass[resolved.tone],
        className
      )}
    >
      {variant === "dot" ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-current opacity-80"
        />
      ) : icon ? (
        <span className="inline-flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-3.5">
          {icon}
        </span>
      ) : null}
      <span>{resolved.label}</span>
    </span>
  );
}
