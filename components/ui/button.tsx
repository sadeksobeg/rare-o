"use client";

import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "text"
  | "inverse-primary"
  | "inverse-secondary"
  | "danger"
  | "quiet";

export type ButtonSize = "sm" | "md" | "lg";

/* `!text-*` beats unlayered `a { color: inherit }` so Link labels stay visible. */
const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-ro-ink !text-[var(--ro-sand-100)] tracking-[0.06em] shadow-[0_1px_2px_color-mix(in_srgb,var(--ro-ink-950)_22%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)] hover:bg-[var(--ro-plum-800)] hover:shadow-[0_4px_14px_color-mix(in_srgb,var(--ro-plum-800)_28%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-100)_26%,transparent)] active:bg-[var(--ro-plum-900)] active:shadow-[inset_0_2px_4px_color-mix(in_srgb,var(--ro-ink-950)_35%,transparent)] focus-visible:outline-[var(--ro-focus)]",
  secondary:
    "border-[1.5px] border-[color-mix(in_srgb,var(--ro-ink-950)_72%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-50)_70%,transparent)] !text-ro-ink tracking-[0.05em] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-50)_80%,transparent)] hover:border-ro-ink hover:bg-[var(--ro-sand-50)] hover:shadow-[0_2px_8px_color-mix(in_srgb,var(--ro-ink-950)_10%,transparent)] active:bg-ro-sunken focus-visible:outline-[var(--ro-focus)]",
  text: "bg-transparent !text-ro-text-2 tracking-[0.04em] underline-offset-[6px] hover:!text-ro-ink hover:underline focus-visible:outline-[var(--ro-focus)]",
  "inverse-primary":
    "bg-[var(--ro-sand-100)] !text-ro-ink tracking-[0.06em] shadow-[0_2px_10px_color-mix(in_srgb,var(--ro-ink-950)_35%,transparent),inset_0_-1px_0_color-mix(in_srgb,var(--ro-ink-950)_10%,transparent)] hover:bg-white hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--ro-ink-950)_40%,transparent)] active:bg-[var(--ro-sand-200)] focus-visible:outline-ro-canvas focus-visible:outline-offset-[3px]",
  "inverse-secondary":
    "border-[1.5px] border-[color-mix(in_srgb,var(--ro-sand-100)_78%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-100)_10%,transparent)] !text-[var(--ro-sand-100)] tracking-[0.05em] backdrop-blur-[2px] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)] hover:border-ro-canvas hover:bg-[color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)] active:bg-[color-mix(in_srgb,var(--ro-sand-100)_24%,transparent)] focus-visible:outline-ro-canvas focus-visible:outline-offset-[3px]",
  danger:
    "bg-[var(--ro-danger-700)] !text-[var(--ro-sand-100)] tracking-[0.04em] shadow-[0_1px_2px_color-mix(in_srgb,var(--ro-ink-950)_18%,transparent)] hover:opacity-90 active:opacity-85 focus-visible:outline-[var(--ro-danger-700)]",
  quiet:
    "border-0 bg-transparent !text-ro-text-2 tracking-[0.03em] hover:!text-ro-ink focus-visible:outline-[var(--ro-focus)]",
};

/** P01 sizes: sm 36 / md 44 / lg 52; padding-inline 20 / 24 / 28. */
const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 min-w-[5.5rem] px-5 text-xs",
  md: "h-11 min-w-[7rem] px-6 text-sm",
  lg: "h-[52px] min-w-[8.5rem] px-8 text-sm",
};

const base =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[var(--ro-r-sm)] font-semibold transition-[color,background-color,border-color,transform,opacity,box-shadow,filter] duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.985] motion-reduce:active:scale-100";

function rippleAllowed(variant: ButtonVariant) {
  return variant === "primary" || variant === "inverse-primary";
}

function spawnRipple(
  host: HTMLElement,
  clientX: number,
  clientY: number,
  tone: "cream" | "ink" = "cream"
) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  const rect = host.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const ring = document.createElement("span");
  ring.className =
    tone === "ink" ? "ro-btn-ripple ro-btn-ripple--ink" : "ro-btn-ripple";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  host.appendChild(ring);
  window.setTimeout(() => ring.remove(), 650);
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  loading,
  ripple,
  onPointerDown,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Defaults on for primary / inverse-primary. */
  ripple?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const useRipple =
    (ripple ?? rippleAllowed(variant)) && rippleAllowed(variant);
  const rippleTone = variant === "inverse-primary" ? "ink" : "cream";

  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
      aria-busy={loading || undefined}
      disabled={props.disabled || loading}
      onPointerDown={(e) => {
        if (useRipple && !props.disabled && !loading) {
          spawnRipple(e.currentTarget, e.clientX, e.clientY, rippleTone);
        }
        onPointerDown?.(e);
      }}
      {...props}
    >
      {loading ? (
        <Loader size={24} className="opacity-90" label="" />
      ) : null}
      <span className={cn(loading && "opacity-80")}>{children}</span>
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  ripple,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Defaults on for primary / inverse-primary. */
  ripple?: boolean;
}) {
  const useRipple =
    (ripple ?? rippleAllowed(variant)) && rippleAllowed(variant);
  const rippleTone = variant === "inverse-primary" ? "ink" : "cream";
  return (
    <Link
      href={href}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
      onPointerDown={
        useRipple
          ? (e) =>
              spawnRipple(e.currentTarget, e.clientX, e.clientY, rippleTone)
          : undefined
      }
    >
      {children}
    </Link>
  );
}

export function IconButton({
  children,
  label,
  className,
  size = "md",
  variant = "quiet",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  const box = size === "sm" ? "size-9" : "size-11";
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(base, variantClass[variant], box, "min-w-0 px-0", className)}
      {...props}
    >
      {children}
    </button>
  );
}
