"use client";

import { useState, type ReactNode } from "react";
import { SegControl } from "@/components/ui-kit/seg-control";

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
  profile: ReactNode;
  security: ReactNode;
  sessions: ReactNode;
}) {
  const [tab, setTab] = useState<"profile" | "security" | "sessions">(
    "profile"
  );

  return (
    <div className="space-y-5">
      <SegControl
        aria-label={profileLabel}
        value={tab}
        onChange={(v) =>
          setTab(
            v === "security" || v === "sessions" || v === "profile" ? v : "profile"
          )
        }
        items={[
          { value: "profile", label: profileLabel },
          { value: "security", label: securityLabel },
          { value: "sessions", label: sessionsLabel },
        ]}
      />
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
