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

/* Semantic surfaces — work in portal dark + light via tokens. */
const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ro-plum-900)] !text-[var(--ro-sand-100)] tracking-[0.06em] shadow-[0_1px_0_color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)_inset,0_12px_28px_-14px_color-mix(in_srgb,var(--ro-plum-900)_55%,transparent)] hover:bg-[var(--ro-plum-800)] hover:-translate-y-px active:translate-y-0 active:bg-[var(--ro-ink-950)] focus-visible:outline-[var(--ro-focus)]",
  secondary:
    "border-[1.5px] border-[color:var(--ro-border)] bg-[color:var(--ro-bg-elevated)] !text-[color:var(--ro-link)] tracking-[0.04em] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ro-text)_6%,transparent)] hover:border-[var(--ro-plum-900)] hover:bg-[color:var(--ro-bg-raised)] hover:-translate-y-px active:translate-y-0 active:bg-[color:var(--ro-bg-sunken)] focus-visible:outline-[var(--ro-focus)]",
  text: "bg-transparent !text-[color:var(--ro-text-2)] tracking-[0.03em] underline-offset-[6px] hover:!text-[color:var(--ro-text)] hover:underline focus-visible:outline-[var(--ro-focus)]",
  "inverse-primary":
    "bg-[var(--ro-sand-100)] !text-[var(--ro-ink-950)] tracking-[0.05em] shadow-[0_2px_10px_color-mix(in_srgb,var(--ro-ink-950)_28%,transparent)] hover:bg-white hover:-translate-y-px active:translate-y-0 active:bg-[var(--ro-sand-200)] focus-visible:outline-[var(--ro-sand-100)] focus-visible:outline-offset-[3px]",
  "inverse-secondary":
    "border-[1.5px] border-[color-mix(in_srgb,var(--ro-sand-100)_72%,transparent)] bg-[color-mix(in_srgb,var(--ro-sand-100)_10%,transparent)] !text-[var(--ro-sand-100)] tracking-[0.04em] backdrop-blur-[2px] hover:border-[var(--ro-sand-100)] hover:bg-[color-mix(in_srgb,var(--ro-sand-100)_18%,transparent)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-[var(--ro-sand-100)] focus-visible:outline-offset-[3px]",
  danger:
    "bg-[var(--ro-danger-700)] !text-[var(--ro-sand-100)] tracking-[0.03em] shadow-[0_1px_2px_color-mix(in_srgb,var(--ro-ink-950)_16%,transparent)] hover:opacity-92 active:opacity-85 focus-visible:outline-[var(--ro-danger-700)]",
  quiet:
    "border-0 bg-transparent !text-[color:var(--ro-text-2)] tracking-[0.02em] hover:!text-[color:var(--ro-text)] focus-visible:outline-[var(--ro-focus)]",
};

/** Touch: sm ≥36, md/lg ≥44. */
const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 min-h-9 min-w-[5.5rem] px-5 text-xs",
  md: "h-11 min-h-11 min-w-[7rem] px-6 text-sm",
  lg: "h-[52px] min-h-[52px] min-w-[8.5rem] px-8 text-sm",
};

const base =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[var(--ro-r-sm)] font-semibold transition-[color,background-color,border-color,transform,opacity,box-shadow,filter] duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0";

function rippleAllowed(variant: ButtonVariant) {
  return (
    variant === "primary" ||
    variant === "inverse-primary" ||
    variant === "secondary" ||
    variant === "inverse-secondary"
  );
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
  ripple?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const useRipple =
    (ripple ?? rippleAllowed(variant)) && rippleAllowed(variant);
  const rippleTone =
    variant === "inverse-primary" || variant === "secondary" ? "ink" : "cream";

  return (
    <button
      ref={ref}
      type={type}
      data-ro-variant={variant}
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
  ripple?: boolean;
}) {
  const useRipple =
    (ripple ?? rippleAllowed(variant)) && rippleAllowed(variant);
  const rippleTone =
    variant === "inverse-primary" || variant === "secondary" ? "ink" : "cream";
  return (
    <Link
      href={href}
      data-ro-variant={variant}
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
  const box = size === "sm" ? "size-9 min-h-9" : "size-11 min-h-11";
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
