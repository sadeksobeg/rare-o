import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { getRequestDictionary } from "@/lib/i18n/server";
import { requireTraderSessionAllowPasswordChange } from "@/lib/auth/trader-session";
import { traderChangePasswordAction, traderLogoutAction } from "@/app/deal-actions";
import { ForcePasswordChangeScreen } from "@/components/auth/force-password-change-screen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TraderForcePasswordChangePage() {
  await requireTraderSessionAllowPasswordChange();
  const { dict } = await getRequestDictionary();

  return (
    <ForcePasswordChangeScreen
      action={traderChangePasswordAction}
      logoutAction={traderLogoutAction}
      logoutLabel={dict.trader.logout}
      dict={dict.forcePasswordChange}
      icon={<ShieldAlert className="size-5" strokeWidth={1.5} />}
      portalHome="/trader"
    />
  );
}
