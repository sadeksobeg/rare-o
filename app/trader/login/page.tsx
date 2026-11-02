import type { Metadata } from "next";
import { traderLoginAction } from "@/app/deal-actions";
import { LoginForm } from "@/components/auth/login-form";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { whatsAppGreetingLink } from "@/lib/config/contact";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TraderLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; notice?: string }>;
}) {
  const { locale, dict } = await getRequestDictionary();
  const { returnTo, notice } = await searchParams;
  const a = dict.auth;
  const accountRequestHref =
    whatsAppGreetingLink(
      locale === "ar"
        ? "مرحباً، أود طلب حساب تاجر في منصة RARE OUD."
        : "Hello — I would like to request a trader account on RARE OUD."
    ) || "/contact";

  return (
    <LoginForm
      action={traderLoginAction}
      brand={dict.brand}
      role="trader"
      roleAdminLabel={a.roleAdmin}
      roleTraderLabel={a.roleTrader}
      tagline={a.tagline}
      headline={a.headline}
      title={a.traderTitle}
      subtitle={a.traderSubtitle}
      footer={
        <a
          href={accountRequestHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--ro-plum-900)] underline-offset-4 hover:underline"
        >
          {dict.trader.accountRequestHelp}
        </a>
      }
      emailLabel={dict.common.email}
      passwordLabel={dict.common.password}
      submitLabel={dict.common.signIn}
      showPasswordLabel={a.showPassword}
      hidePasswordLabel={a.hidePassword}
      loginErrorLabel={a.loginError}
      loginLockedLabel={a.loginLocked}
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
    >
      <AdminLocaleToggle
        locale={locale}
        label={dict.common.language}
        tone="on-dark"
      />
    </LoginForm>
  );
}
