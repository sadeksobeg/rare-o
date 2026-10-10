/**
 * Thin wrappers over Button (P2). Keep exports for existing imports.
 */
import {
  Button,
  ButtonLink,
  type ButtonVariant,
} from "@/components/ui/button";

type LegacyVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "on-dark"
  | "on-dark-outline";

function mapVariant(v: LegacyVariant): ButtonVariant {
  switch (v) {
    case "ghost":
      return "text";
    case "on-dark":
      return "inverse-primary";
    case "on-dark-outline":
      return "inverse-secondary";
    case "secondary":
      return "secondary";
    default:
      return "primary";
  }
}

export function RoButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: LegacyVariant;
  className?: string;
}) {
  return (
    <ButtonLink
      href={href}
      variant={mapVariant(variant)}
      className={className}
    >
      {children}
    </ButtonLink>
  );
}

export function RoButton({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: LegacyVariant;
}) {
  return (
    <Button
      type={type}
      variant={mapVariant(variant)}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}
