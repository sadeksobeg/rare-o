"use client";

import { useState } from "react";
import { traderChangePasswordAction } from "@/app/deal-actions";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Banner } from "@/components/ui/banner";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function TraderPasswordSettings({
  forceDict,
  sectionDict,
}: {
  forceDict: Dictionary["forcePasswordChange"];
  sectionDict: Dictionary["changePassword"];
}) {
  const [done, setDone] = useState(false);

  return (
    <div className="ro-portal-card space-y-4 border p-5 sm:p-6">
      <div>
        <h2 className="font-display text-base font-semibold text-ro-ink">
          {sectionDict.sectionTitle}
        </h2>
        <p className="text-sm text-ro-muted">{sectionDict.sectionLead}</p>
      </div>
      {done ? <Banner tone="success">{sectionDict.success}</Banner> : null}
      <ChangePasswordForm
        action={traderChangePasswordAction}
        labels={{ ...forceDict, submit: sectionDict.submit }}
        onSuccess={() => setDone(true)}
        submitClassName="w-fit"
      />
    </div>
  );
}
