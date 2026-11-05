import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AdminSecuritySettings } from "@/components/admin/security-settings";
import { AdminPasswordSettings } from "@/components/admin/password-settings";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminSecuritySettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { totpEnabledAt: true, email: true },
  });
  const { dict } = await getRequestDictionary();

  return (
    <section className="ro-portal-stagger mx-auto max-w-xl space-y-6 pb-16">
      <p>
        <Link
          href="/admin/settings"
          className="text-sm font-medium text-[color:var(--ro-accent-fg,var(--ro-plum-800))] underline-offset-4 hover:underline"
        >
          {dict.adminUi.settingsHubTitle}
        </Link>
      </p>
      <PageHeader
        title={dict.adminUi.settingsSecurity}
        description={dict.auth.totpLabel}
        icon={<ShieldCheck className="size-5" strokeWidth={1.5} />}
      />
      <div className="ro-portal-card space-y-6 border p-4 md:p-5">
        <AdminPasswordSettings
          forceDict={dict.forcePasswordChange}
          sectionDict={dict.changePassword}
        />
        <AdminSecuritySettings
          email={admin?.email ?? session.email}
          totpEnabled={Boolean(admin?.totpEnabledAt)}
          accountLabel={dict.common.email}
          enabledLabel={dict.common.switchOn}
          disabledLabel={dict.common.switchOff}
          enrollLabel={dict.auth.totpEnrollButton}
          resetLabel={dict.auth.totpResetButton}
        />
      </div>
    </section>
  );
}
