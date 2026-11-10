import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getRequestDictionary } from "@/lib/i18n/server";
import { requireAdminSessionAllowPasswordChange } from "@/lib/auth/admin-session";
import { adminChangePasswordAction } from "@/app/actions";
import { adminLogoutAction } from "@/app/admin-logout-action";
import { ForcePasswordChangeScreen } from "@/components/auth/force-password-change-screen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminForcePasswordChangePage() {
  await requireAdminSessionAllowPasswordChange();
  const { dict } = await getRequestDictionary();

  return (
    <ForcePasswordChangeScreen
      action={adminChangePasswordAction}
      logoutAction={adminLogoutAction}
      logoutLabel={dict.admin.logout}
      dict={dict.forcePasswordChange}
      icon={<ShieldAlert className="size-5" strokeWidth={1.5} />}
      portalHome="/admin"
    />
  );
}
