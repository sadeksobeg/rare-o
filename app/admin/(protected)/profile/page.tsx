import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Laptop, Mail, ShieldCheck, UserRound } from "lucide-react";
import { AdminSignOutOthers } from "@/components/admin/sign-out-others";
import {
  AdminSettingsCard,
  AdminSettingsShell,
} from "@/components/admin/settings-shell";
import { AppearanceCard } from "@/components/portal/appearance-card";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminProfilePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [admin, { dict, locale }] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: session.sub },
      select: {
        name: true,
        email: true,
        totpEnabledAt: true,
        passwordChangedAt: true,
      },
    }),
    getRequestDictionary(),
  ]);
  if (!admin) redirect("/admin/login");

  const a = dict.auth;
  const u = dict.adminUi;

  return (
    <AdminSettingsShell
      locale={locale}
      title={a.profileTitle}
      description={a.profileSubtitle}
      breadcrumb={[
        { href: "/admin/settings", label: u.settingsHubTitle },
        { label: a.profileTitle },
      ]}
      navLabel={u.settingsHubTitle}
      nav={[
        {
          href: "/admin/profile",
          label: a.profileTab,
          icon: <UserRound strokeWidth={1.5} aria-hidden />,
          active: true,
        },
        {
          href: "/admin/settings/security",
          label: a.securityTab,
          icon: <ShieldCheck strokeWidth={1.5} aria-hidden />,
        },
      ]}
    >
      <AppearanceCard
        title={dict.common.themeGroup}
        description={a.appearanceLead}
        lightLabel={dict.common.themeLight}
        darkLabel={dict.common.themeDark}
      />

      <AdminSettingsCard title={a.profileTab}>
        <div className="divide-y divide-[color:var(--rad-bd)]">
          <div className="flex gap-4 py-4 first:pt-0">
            <span className="ro-portal-icon-well mt-0.5">
              <UserRound className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold" style={{ color: "var(--rad-tx3)" }}>
                {a.profileName}
              </p>
              <p className="text-base font-semibold" style={{ color: "var(--rad-tx)" }}>
                {admin.name}
              </p>
            </div>
          </div>
          <div className="flex gap-4 py-4">
            <span className="ro-portal-icon-well mt-0.5">
              <Mail className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold" style={{ color: "var(--rad-tx3)" }}>
                {a.profileEmail}
              </p>
              <p dir="ltr" className="text-base font-semibold" style={{ color: "var(--rad-tx)" }}>
                {admin.email}
              </p>
            </div>
          </div>
          <div className="flex gap-4 py-4 last:pb-0">
            <span className="ro-portal-icon-well mt-0.5">
              <ShieldCheck className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold" style={{ color: "var(--rad-tx3)" }}>
                {a.profileRole}
              </p>
              <p className="text-base font-semibold" style={{ color: "var(--rad-tx)" }}>
                {a.profileRoleAdmin}
              </p>
            </div>
          </div>
        </div>
        <p
          className="border-t border-[color:var(--rad-bd)] pt-3 text-sm"
          style={{ color: "var(--rad-tx3)" }}
        >
          {a.profileSecurityNote}
        </p>
      </AdminSettingsCard>

      <AdminSettingsCard title={a.activeSessions} id="sessions">
        <p className="text-sm" style={{ color: "var(--rad-tx2)" }}>
          {a.activeSessionsDesc}
        </p>
        <div
          className="flex items-center justify-between gap-3 rounded-[11px] border px-4 py-3"
          style={{ borderColor: "var(--rad-bd)" }}
        >
          <div className="flex items-center gap-3">
            <Laptop
              className="size-5"
              strokeWidth={1.5}
              aria-hidden
              style={{ color: "var(--rad-tx3)" }}
            />
            <div>
              <p className="text-sm font-medium" dir="ltr" style={{ color: "var(--rad-tx)" }}>
                {admin.email}
              </p>
              <p className="text-xs" style={{ color: "var(--rad-tx3)" }}>
                {admin.passwordChangedAt
                  ? admin.passwordChangedAt.toISOString().slice(0, 16)
                  : "—"}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--rad-ok)" }}>
            {a.currentSession}
          </span>
        </div>
        <AdminSignOutOthers
          label={a.signOutOthers}
          title={a.signOutOthersTitle}
          description={a.signOutOthersDesc}
          confirmLabel={a.signOutOthers}
          cancelLabel={dict.common.cancel}
          successLabel={a.signedOutOthers}
        />
      </AdminSettingsCard>
    </AdminSettingsShell>
  );
}
