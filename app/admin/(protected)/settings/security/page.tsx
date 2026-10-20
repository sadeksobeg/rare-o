import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { AdminSecuritySettings } from "@/components/admin/security-settings";
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
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {dict.auth.adminTitle} — 2FA
        </h1>
        <p className="text-sm text-ro-muted">
          TOTP authenticator + one-time recovery codes. Required when{" "}
          <code className="text-xs">REQUIRE_ADMIN_2FA=1</code>.
        </p>
      </div>
      <AdminSecuritySettings
        email={admin?.email ?? session.email}
        totpEnabled={Boolean(admin?.totpEnabledAt)}
      />
    </div>
  );
}
