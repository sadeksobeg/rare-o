"use client";

import { useState } from "react";
import { adminChangePasswordAction } from "@/app/actions";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Banner } from "@/components/ui/banner";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function AdminPasswordSettings({
  forceDict,
  sectionDict,
}: {
  forceDict: Dictionary["forcePasswordChange"];
  sectionDict: Dictionary["changePassword"];
}) {
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-4 rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface p-6">
      <div>
        <h2 className="font-display text-base font-semibold text-ro-ink">
          {sectionDict.sectionTitle}
        </h2>
        <p className="text-sm text-ro-muted">{sectionDict.sectionLead}</p>
      </div>
      {done ? <Banner tone="success">{sectionDict.success}</Banner> : null}
      <ChangePasswordForm
        action={adminChangePasswordAction}
        labels={{ ...forceDict, submit: sectionDict.submit }}
        onSuccess={() => setDone(true)}
        submitClassName="w-fit"
      />
    </div>
  );
}
