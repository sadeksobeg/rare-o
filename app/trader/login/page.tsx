import { traderLoginAction } from "@/app/deal-actions";
import { LoginForm } from "@/components/auth/login-form";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { whatsAppGreetingLink } from "@/lib/config/contact";
import { getRequestDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TraderLoginPage() {
  const { locale, dict } = await getRequestDictionary();
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
      hint={
        <>
          <p>{dict.auth.traderHint}</p>
          <p className="mt-2">
            <a
              href={accountRequestHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--ro-plum-900)] underline-offset-2 hover:underline"
            >
              {dict.trader.accountRequestHelp}
            </a>
          </p>
        </>
      }
      emailLabel={dict.common.email}
      passwordLabel={dict.common.password}
      submitLabel={dict.common.signIn}
      showPasswordLabel={dict.auth.showPassword}
      hidePasswordLabel={dict.auth.hidePassword}
      inverse
      localeSlot={
        <AdminLocaleToggle
          locale={locale}
          label={dict.common.language}
          tone="on-dark"
        />
      }
    />
  );
}
