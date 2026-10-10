import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "on-dark" | "on-dark-outline";

const variants: Record<Variant, string> = {
  primary:
    "bg-ro-purple text-ro-cream hover:bg-ro-black focus-visible:outline-ro-purple",
  secondary:
    "border border-ro-line bg-transparent text-ro-black hover:border-ro-purple hover:text-ro-purple focus-visible:outline-ro-purple",
  ghost:
    "bg-transparent text-ro-muted underline-offset-8 hover:text-ro-black hover:underline focus-visible:outline-ro-purple",
  "on-dark":
    "bg-ro-cream text-ro-black hover:bg-white focus-visible:outline-ro-cream",
  "on-dark-outline":
    "border border-ro-line-on-dark bg-transparent text-ro-cream hover:border-ro-cream focus-visible:outline-ro-cream",
};

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[0.75rem] tracking-[0.18em] uppercase transition-[color,background-color,border-color,transform] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.985]";

export function RoButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}

export function RoButton({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
