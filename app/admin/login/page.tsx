import type { Metadata } from "next";
import { adminLoginAction } from "@/app/actions";
import { LoginForm } from "@/components/auth/login-form";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; notice?: string }>;
}) {
  const { locale, dict } = await getRequestDictionary();
  const { returnTo, notice } = await searchParams;
  const ar = locale === "ar";

  return (
    <LoginForm
      action={adminLoginAction}
      brand={dict.brand}
      role="admin"
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
      title={ar ? "دخول الإدارة" : "Admin Sign In"}
      subtitle={
        ar
          ? "صلاحية كاملة على التجزئة والصفقات والجملة والوساطة وصندوق واتساب"
          : "Full access to retail, deals, wholesale, brokerage, and the WhatsApp inbox"
      }
      emailLabel={dict.common.email}
      passwordLabel={dict.common.password}
      submitLabel={dict.common.signIn}
      showPasswordLabel={dict.auth.showPassword}
      hidePasswordLabel={dict.auth.hidePassword}
      loginErrorLabel={dict.auth.loginError}
      loginLockedLabel={dict.auth.loginLocked}
      totpLabel={dict.auth.totpLabel}
      totpRequiredLabel={dict.auth.totpRequired}
      totpInvalidLabel={dict.auth.totpInvalid}
      totpEnrollLabel={dict.auth.totpEnrollRequired}
      capsLockLabel={ar ? "مفتاح Caps Lock مُفعَّل" : "Caps Lock is on"}
      rateLimitFooter={
        ar
          ? "محاولات الدخول المتكررة تُوقَف مؤقتاً لحماية حسابك"
          : "Repeated sign-in attempts are paused temporarily to protect your account"
      }
      returnTo={returnTo}
      notice={
        notice === "session_invalidated"
          ? dict.auth.sessionInvalidatedNotice
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
