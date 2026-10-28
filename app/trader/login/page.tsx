import { traderLoginAction } from "@/app/deal-actions";
import { LoginForm } from "@/components/auth/login-form";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { whatsAppGreetingLink } from "@/lib/config/contact";
import { getRequestDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TraderLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale, dict } = await getRequestDictionary();
  const { returnTo } = await searchParams;
  const accountRequestHref =
    whatsAppGreetingLink(
      locale === "ar"
        ? "مرحباً، أود طلب حساب تاجر في منصة RARE OUD."
        : "Hello — I would like to request a trader account on RARE OUD."
    ) || "/contact";

  return (
    <LoginForm
      action={traderLoginAction}
      title={dict.auth.traderTitle}
      brand={dict.brand}
      hint={dict.auth.traderHint}
      footer={
        <a
          href={accountRequestHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--ro-sand-100)] underline-offset-4 hover:underline"
        >
          {dict.trader.accountRequestHelp}
        </a>
      }
      emailLabel={dict.common.email}
      passwordLabel={dict.common.password}
      submitLabel={dict.common.signIn}
      showPasswordLabel={dict.auth.showPassword}
      hidePasswordLabel={dict.auth.hidePassword}
      loginErrorLabel={dict.auth.loginError}
      loginLockedLabel={dict.auth.loginLocked}
      returnTo={returnTo}
      inverse
    >
      <AdminLocaleToggle
        locale={locale}
        label={dict.common.language}
        tone="on-dark"
      />
    </LoginForm>
  );
}
