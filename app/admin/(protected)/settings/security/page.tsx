import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AdminSecuritySettings } from "@/components/admin/security-settings";
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
    <section className="ro-portal-stagger mx-auto max-w-xl space-y-6">
      <PageHeader
        title={dict.admin.settings}
        description={dict.auth.totpLabel}
        icon={<ShieldCheck className="size-5" strokeWidth={2} />}
      />
      <AdminSecuritySettings
        email={admin?.email ?? session.email}
        totpEnabled={Boolean(admin?.totpEnabledAt)}
        accountLabel={dict.common.email}
        enabledLabel={dict.common.switchOn}
        disabledLabel={dict.common.switchOff}
        enrollLabel={dict.auth.totpLabel}
      />
    </section>
  );
}
