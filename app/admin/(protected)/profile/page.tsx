import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Laptop, Mail, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPasswordSettings } from "@/components/admin/password-settings";
import { AdminProfileTabs } from "@/components/admin/profile-tabs";
import { AdminSecuritySettings } from "@/components/admin/security-settings";
import { AdminSignOutOthers } from "@/components/admin/sign-out-others";
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

  const [admin, { dict }] = await Promise.all([
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
  const initial = admin.name.trim().slice(0, 1) || "A";

  return (
    <section className="ro-portal-stagger mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={a.profileTitle}
        description={a.profileSubtitle}
        icon={<UserRound className="size-5" strokeWidth={1.5} />}
      />

      <AppearanceCard
        title={dict.common.themeGroup}
        description={a.profileSubtitle}
        lightLabel={dict.common.themeLight}
        darkLabel={dict.common.themeDark}
      />

      <div className="overflow-hidden rounded-[var(--ro-r-sm)] border border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)] bg-ro-surface">
        <div className="flex flex-wrap items-center gap-5 bg-[linear-gradient(135deg,var(--ro-plum-900)_0%,var(--ro-ink-950)_100%)] px-5 py-7 text-[var(--ro-sand-100)] sm:px-6">
          <span
            aria-hidden
            className="flex size-[4.5rem] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--ro-sand-100)_16%,transparent)] font-display text-2xl font-semibold text-[var(--ro-sand-50)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--ro-sand-100)_28%,transparent)]"
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display text-2xl font-semibold tracking-tight">
              {admin.name}
            </p>
            <p
              dir="ltr"
              className="text-sm text-[color-mix(in_srgb,var(--ro-sand-100)_72%,transparent)]"
            >
              {admin.email}
            </p>
          </div>
        </div>
        <p className="border-t border-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)] px-5 py-3 text-xs text-ro-muted sm:px-6">
          {a.avatarUnavailable}
        </p>
      </div>

      <AdminProfileTabs
        profileLabel={a.profileTab}
        securityLabel={a.securityTab}
        sessionsLabel={a.sessionsTab}
        profile={
          <div className="space-y-0 overflow-hidden rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface">
            <dl>
              <div className="flex gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)] px-5 py-4 sm:px-6">
                <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]">
                  <UserRound className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <dt className="text-xs font-semibold text-ro-muted">
                    {a.profileName}
                  </dt>
                  <dd className="text-base font-semibold text-ro-ink">
                    {admin.name}
                  </dd>
                </div>
              </div>
              <div className="flex gap-4 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)] px-5 py-4 sm:px-6">
                <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]">
                  <Mail className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <dt className="text-xs font-semibold text-ro-muted">
                    {a.profileEmail}
                  </dt>
                  <dd dir="ltr" className="text-base font-semibold text-ro-ink">
                    {admin.email}
                  </dd>
                </div>
              </div>
              <div className="flex gap-4 px-5 py-4 sm:px-6">
                <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center bg-[var(--ro-plum-100)] text-[var(--ro-plum-900)]">
                  <ShieldCheck
                    className="size-4"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <dt className="text-xs font-semibold text-ro-muted">
                    {a.profileRole}
                  </dt>
                  <dd className="text-base font-semibold text-ro-ink">
                    {a.profileRoleAdmin}
                  </dd>
                </div>
              </div>
            </dl>
            <p className="border-t border-[color-mix(in_srgb,var(--ro-plum-900)_10%,transparent)] px-5 py-3 text-sm text-ro-muted sm:px-6">
              {a.profileSecurityNote}
            </p>
          </div>
        }
        security={
          <div className="space-y-6">
            <AdminPasswordSettings
              forceDict={dict.forcePasswordChange}
              sectionDict={dict.changePassword}
            />
            <AdminSecuritySettings
              email={admin.email}
              totpEnabled={Boolean(admin.totpEnabledAt)}
              accountLabel={dict.common.email}
              enabledLabel={dict.common.switchOn}
              disabledLabel={dict.common.switchOff}
              enrollLabel={a.totpEnrollButton}
              resetLabel={a.totpResetButton}
            />
          </div>
        }
        sessions={
          <div className="space-y-4 rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface p-6">
            <div>
              <h2 className="font-display text-base font-semibold text-ro-ink">
                {a.activeSessions}
              </h2>
              <p className="mt-1 text-sm text-ro-muted">
                {a.activeSessionsDesc}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[var(--ro-r-sm)] border border-[color-mix(in_srgb,var(--ro-plum-900)_12%,transparent)] px-4 py-3">
              <div className="flex items-center gap-3">
                <Laptop
                  className="size-5 text-ro-muted"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium text-ro-ink" dir="ltr">
                    {admin.email}
                  </p>
                  <p className="text-xs text-ro-muted">
                    {admin.passwordChangedAt
                      ? admin.passwordChangedAt.toISOString().slice(0, 16)
                      : "—"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#1F5130]">
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
          </div>
        }
      />
    </section>
  );
}
