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
  const ar = locale === "ar";
  const accountRequestHref =
    whatsAppGreetingLink(
      ar
        ? "مرحباً، أود طلب حساب تاجر في منصة RARE OUD."
        : "Hello — I would like to request a trader account on RARE OUD."
    ) || "/contact";

  return (
    <LoginForm
      action={traderLoginAction}
      brand={dict.brand}
      role="trader"
      roleAdminLabel={ar ? "إدارة" : "Admin"}
      roleTraderLabel={ar ? "تاجر" : "Trader"}
      tagline={
        ar
          ? "آلات عود نادرة — مصنوعة يدوياً"
          : "Rare oud instruments — handcrafted"
      }
      headline={
        ar ? "صدى الصنعة، محفوظ بدقّة" : "The echo of craft, kept precisely"
      }
      title={ar ? "دخول التاجر" : "Trader Sign In"}
      subtitle={
        ar
          ? "اقترح صفقات، اطلب بالجملة، واطلب وساطة على قطعة رأيتها"
          : "Propose deals, request wholesale, and ask us to broker a piece you've found"
      }
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
      showPasswordLabel={dict.auth.showPassword}
      hidePasswordLabel={dict.auth.hidePassword}
      loginErrorLabel={dict.auth.loginError}
      loginLockedLabel={dict.auth.loginLocked}
      capsLockLabel={ar ? "مفتاح Caps Lock مُفعَّل" : "Caps Lock is on"}
      rateLimitFooter={
        ar
          ? "محاولات الدخول المتكررة تُوقَف مؤقتاً لحماية حسابك"
          : "Repeated sign-in attempts are paused temporarily to protect your account"
      }
      returnTo={returnTo}
    >
      <AdminLocaleToggle
        locale={locale}
        label={dict.common.language}
        tone="on-dark"
      />
    </LoginForm>
  );
}
