import { adminLoginAction } from "@/app/actions";
import { LoginForm } from "@/components/auth/login-form";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function AdminLoginPage() {
  const { dict } = await getRequestDictionary();

  return (
    <LoginForm
      action={adminLoginAction}
      title={dict.auth.adminTitle}
      emailLabel={dict.common.email}
      passwordLabel={dict.common.password}
      submitLabel={dict.common.signIn}
      inverse
    />
  );
}
