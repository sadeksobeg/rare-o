import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { AdminSecuritySettings } from "@/components/admin/security-settings";
import { AdminPasswordSettings } from "@/components/admin/password-settings";
import { AdminSettingsShell } from "@/components/admin/settings-shell";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminSecuritySettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [{ dict, locale }, admin] = await Promise.all([
    getRequestDictionary(),
    prisma.adminUser.findUnique({
      where: { id: session.sub },
      select: { totpEnabledAt: true, email: true },
    }),
  ]);
  const a = dict.auth;
  const u = dict.adminUi;

  return (
    <AdminSettingsShell
      locale={locale}
      title={u.settingsSecurity}
      description={u.settingsSecurityLead}
      breadcrumb={[
        { href: "/admin/settings", label: u.settingsHubTitle },
        { label: u.settingsSecurity },
      ]}
      navLabel={u.settingsHubTitle}
      nav={[
        {
          href: "/admin/profile",
          label: a.profileTab,
          icon: <UserRound strokeWidth={1.5} aria-hidden />,
        },
        {
          href: "/admin/settings/security",
          label: a.securityTab,
          icon: <ShieldCheck strokeWidth={1.5} aria-hidden />,
          active: true,
        },
      ]}
    >
      <AdminPasswordSettings
        forceDict={dict.forcePasswordChange}
        sectionDict={dict.changePassword}
      />
      <AdminSecuritySettings
        email={admin?.email ?? session.email}
        totpEnabled={Boolean(admin?.totpEnabledAt)}
        accountLabel={dict.common.email}
        enabledLabel={dict.common.switchOn}
        disabledLabel={u.settings2faOffShort}
        enrollLabel={a.totpEnrollButton}
        resetLabel={a.totpResetButton}
        sectionTitle={a.securityTab}
      />
    </AdminSettingsShell>
  );
}
