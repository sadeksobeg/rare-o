"use client";

import { SegControl } from "@/components/ui-kit/seg-control";
import { usePortalTheme } from "@/components/portal/portal-theme";

export function AppearanceCard({
  title,
  description,
  lightLabel,
  darkLabel,
  groupLabel,
}: {
  title: string;
  description: string;
  lightLabel: string;
  darkLabel: string;
  groupLabel?: string;
}) {
  const { theme, setTheme } = usePortalTheme();

  return (
    <section className="rounded-[14px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface)] p-5 shadow-[var(--rad-sh)] sm:p-6">
      <h2
        className="text-[15px] font-semibold"
        style={{ color: "var(--rad-tx)", fontFamily: "var(--rad-font, inherit)" }}
      >
        {title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--rad-tx2)" }}>
        {description}
      </p>
      <div className="mt-4">
        {groupLabel ? (
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--rad-tx2)" }}>
            {groupLabel}
          </p>
        ) : null}
        <SegControl
          aria-label={groupLabel ?? title}
          value={theme}
          onChange={(v) => setTheme(v === "light" ? "light" : "dark")}
          items={[
            { value: "dark", label: darkLabel },
            { value: "light", label: lightLabel },
          ]}
        />
      </div>
    </section>
  );
}
