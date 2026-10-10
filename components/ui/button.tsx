import Link from "next/link";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "text"
  | "inverse-primary"
  | "inverse-secondary"
  | "danger"
  | "quiet";

export type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-ro-ink text-ro-canvas hover:bg-ro-plum focus-visible:outline-[var(--ro-focus)]",
  secondary:
    "border border-ro-ink bg-transparent text-ro-ink hover:bg-ro-sunken focus-visible:outline-[var(--ro-focus)]",
  text: "bg-transparent text-ro-text-2 underline-offset-4 hover:text-ro-ink hover:underline focus-visible:outline-[var(--ro-focus)]",
  "inverse-primary":
    "bg-ro-canvas text-ro-ink hover:bg-white focus-visible:outline-ro-canvas",
  "inverse-secondary":
    "border border-ro-line-on-dark bg-transparent text-ro-canvas hover:border-ro-canvas focus-visible:outline-ro-canvas",
  danger:
    "bg-[var(--ro-danger-700)] text-ro-canvas hover:opacity-90 focus-visible:outline-[var(--ro-danger-700)]",
  quiet:
    "border-0 bg-transparent text-ro-text-2 hover:text-ro-ink focus-visible:outline-[var(--ro-focus)]",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-5 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-[52px] px-7 text-sm",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--ro-r-sm)] font-semibold transition-[color,background-color,border-color,transform,opacity] duration-[var(--ro-dur-fast)] ease-[var(--ro-ease-standard)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
      aria-busy={loading || undefined}
      disabled={props.disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
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
      className={cn(base, variantClass[variant], box, "px-0", className)}
      {...props}
    >
      {children}
    </button>
  );
}
