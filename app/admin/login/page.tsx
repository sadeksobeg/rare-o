import type { Metadata } from "next";
import { adminLoginAction } from "@/app/actions";
import { LoginForm } from "@/components/auth/login-form";
import { whatsAppGreetingLink } from "@/lib/config/contact";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; notice?: string }>;
}) {
  const { dict } = await getRequestDictionary();
  const { returnTo, notice } = await searchParams;
  const a = dict.auth;

  return (
    <LoginForm
      action={adminLoginAction}
      brand={dict.brand}
      role="admin"
      roleAdminLabel={a.roleAdmin}
      roleTraderLabel={a.roleTrader}
      tagline={a.tagline}
      headline={a.headline}
      title={a.adminTitle}
      subtitle={a.adminSubtitle}
      emailLabel={dict.common.email}
      passwordLabel={dict.common.password}
      submitLabel={dict.common.signIn}
      showPasswordLabel={a.showPassword}
      hidePasswordLabel={a.hidePassword}
      loginErrorLabel={a.loginError}
      loginLockedLabel={a.loginLocked}
      totpLabel={a.totpLabel}
      totpRequiredLabel={a.totpRequired}
      totpInvalidLabel={a.totpInvalid}
      totpEnrollLabel={a.totpEnrollRequired}
      capsLockLabel={a.capsLockOn}
      rateLimitFooter={a.rateLimitFooter}
      forgotPasswordLabel={a.forgotPassword}
      forgotTitle={a.forgotTitle}
      forgotSubtitle={a.forgotSubtitle}
      forgotWhatsAppLabel={a.forgotWhatsApp}
      forgotWhatsAppHref={whatsAppGreetingLink(a.forgotWhatsAppMessage)}
      backToSignInLabel={a.backToSignIn}
      returnTo={returnTo}
      notice={
        notice === "session_invalidated"
          ? a.sessionInvalidatedNotice
          : undefined
      }
    />
  );
}
