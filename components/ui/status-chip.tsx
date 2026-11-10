import {
  Circle,
  CircleCheck,
  CircleX,
  Clock,
  Info,
  Minus,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  getStatusChipProps,
  type StatusDomain,
} from "@/lib/ui/status-labels";
import type { StatusTone } from "@/lib/ui/status";

const toneIcon: Record<StatusTone, typeof Info> = {
  neutral: Circle,
  info: Info,
  progress: Clock,
  attention: TriangleAlert,
  success: CircleCheck,
  danger: CircleX,
  closed: Minus,
};

const toneClass: Record<StatusTone, string> = {
  neutral:
    "border border-[color-mix(in_srgb,var(--ro-ink-950)_12%,transparent)] bg-[var(--ro-sand-300)] text-[var(--ro-ink-700)]",
  info: "border border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)] bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]",
  progress:
    "border border-[color-mix(in_srgb,var(--ro-progress-700)_14%,transparent)] bg-[var(--ro-progress-100)] text-[var(--ro-progress-700)]",
  attention:
    "border border-[color-mix(in_srgb,var(--rad-warn,var(--ro-amber-800))_28%,transparent)] bg-[color:var(--rad-warns,var(--ro-amber-100))] text-[color:var(--rad-warn,var(--ro-amber-800))]",
  success:
    "border border-[color-mix(in_srgb,var(--ro-success-700)_14%,transparent)] bg-[var(--ro-success-100)] text-[var(--ro-success-700)]",
  danger:
    "border border-[color-mix(in_srgb,var(--ro-danger-700)_14%,transparent)] bg-[var(--ro-danger-100)] text-[var(--ro-danger-700)]",
  closed:
    "border border-[color-mix(in_srgb,var(--ro-ink-950)_10%,transparent)] bg-[#E6E0EA] text-[var(--ro-ink-500)]",
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

  const ToneIcon = toneIcon[resolved.tone];

  return (
    <span
      data-ro-status={resolved.tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--ro-r-sm)] font-bold tracking-wide",
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
      ) : (
        <span className="inline-flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-3.5">
          {icon ?? (
            <ToneIcon className="size-3.5" strokeWidth={1.5} aria-hidden />
          )}
        </span>
      )}
      <span>{resolved.label}</span>
    </span>
  );
}
