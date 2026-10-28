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
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale, dict } = await getRequestDictionary();
  const { returnTo } = await searchParams;

  return (
    <LoginForm
      action={adminLoginAction}
      title={dict.auth.adminTitle}
      brand={dict.brand}
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
