import { traderLoginAction } from "@/app/deal-actions";
import { LoginForm } from "@/components/auth/login-form";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderLoginPage() {
  const { dict } = await getRequestDictionary();

  return (
    <LoginForm
      action={traderLoginAction}
      title={dict.auth.traderTitle}
      hint={dict.auth.traderHint}
      emailLabel={dict.common.email}
      passwordLabel={dict.common.password}
      submitLabel={dict.common.signIn}
    />
  );
}
