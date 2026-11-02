"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function AdminProfileTabs({
  profileLabel,
  securityLabel,
  sessionsLabel,
  profile,
  security,
  sessions,
}: {
  profileLabel: string;
  securityLabel: string;
  sessionsLabel: string;
  profile: React.ReactNode;
  security: React.ReactNode;
  sessions: React.ReactNode;
}) {
  const [tab, setTab] = useState<"profile" | "security" | "sessions">(
    "profile"
  );

  const items = [
    { id: "profile" as const, label: profileLabel },
    { id: "security" as const, label: securityLabel },
    { id: "sessions" as const, label: sessionsLabel },
  ];

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label={profileLabel}
        className="flex flex-wrap gap-1 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)]"
      >
        {items.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`admin-profile-tab-${item.id}`}
              aria-controls={`admin-profile-panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={cn(
                "min-h-11 px-4 text-sm font-semibold transition-colors",
                selected
                  ? "border-b-2 border-[var(--ro-plum-900)] text-ro-ink"
                  : "text-[var(--ro-ink-600)] hover:text-ro-ink"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`admin-profile-panel-${tab}`}
        aria-labelledby={`admin-profile-tab-${tab}`}
      >
        {tab === "profile" ? profile : null}
        {tab === "security" ? security : null}
        {tab === "sessions" ? sessions : null}
      </div>
    </div>
  );
}
