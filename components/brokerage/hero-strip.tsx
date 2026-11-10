import type { ReactNode } from "react";
import { PortalHeroStrip } from "@/components/admin/portal-hero";

/** @deprecated Prefer PortalHeroStrip — kept for brokerage call sites. */
export function BrokerageHeroStrip({
  eyebrow,
  title,
  subtitle,
  actions,
  stats,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  stats?: { label: string; value: string | number; hint?: string }[];
  className?: string;
}) {
  return (
    <PortalHeroStrip
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
      stats={stats}
      className={className}
    />
  );
}
