"use client";

import { useState } from "react";
import { adminChangePasswordAction } from "@/app/actions";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { AdminSettingsCard } from "@/components/admin/settings-shell";
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
    <AdminSettingsCard title={sectionDict.sectionTitle}>
      <p className="text-sm" style={{ color: "var(--rad-tx2)" }}>
        {sectionDict.sectionLead}
      </p>
      {done ? <Banner tone="success">{sectionDict.success}</Banner> : null}
      <ChangePasswordForm
        action={adminChangePasswordAction}
        labels={{
          ...forceDict,
          currentPassword: sectionDict.currentPassword,
          submit: sectionDict.submit,
        }}
        onSuccess={() => setDone(true)}
        submitClassName="w-fit"
      />
    </AdminSettingsCard>
  );
}
