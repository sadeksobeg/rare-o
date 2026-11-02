"use client";

import { PortalThemeToggle } from "@/components/portal/portal-theme";

export function AppearanceCard({
  title,
  description,
  lightLabel,
  darkLabel,
}: {
  title: string;
  description: string;
  lightLabel: string;
  darkLabel: string;
}) {
  return (
    <div className="rounded-[var(--ro-r-sm)] border border-[color:var(--border)] bg-[color:var(--bg-surface-solid)] p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-[color:var(--text)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--text-muted)]">{description}</p>
      <PortalThemeToggle
        lightLabel={lightLabel}
        darkLabel={darkLabel}
        className="mt-4 inline-flex gap-2"
      />
    </div>
  );
}
