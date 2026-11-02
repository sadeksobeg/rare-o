import {
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Amazon-like purchase panel chrome around price + CTA. */
export function ProductBuyBox({
  children,
  trust,
  className,
}: {
  children: React.ReactNode;
  trust: Array<{ icon: "shield" | "truck" | "package" | "whatsapp"; label: string }>;
  className?: string;
}) {
  const icons = {
    shield: ShieldCheck,
    truck: Truck,
    package: Package,
    whatsapp: MessageCircle,
  } as const;

  return (
    <aside
      className={cn(
        "space-y-5 rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-ink-950)_12%,transparent)] bg-ro-surface p-5 shadow-[0_18px_40px_-28px_rgba(11,8,13,0.35)]",
        className
      )}
    >
      {children}
      {trust.length > 0 ? (
        <ul className="space-y-2.5 border-t border-ro-line pt-4">
          {trust.map((row) => {
            const Icon = icons[row.icon];
            return (
              <li
                key={row.label}
                className="flex items-start gap-2.5 text-xs leading-snug text-ro-muted"
              >
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-[var(--ro-plum-900)]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span>{row.label}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </aside>
  );
}
