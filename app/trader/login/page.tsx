import Link from "next/link";
import { traderLoginAction } from "@/app/deal-actions";
import { LoginForm } from "@/components/auth/login-form";
import { AdminLocaleToggle } from "@/components/admin/locale-toggle";
import { getRequestDictionary } from "@/lib/i18n/server";
import { href } from "@/lib/href";

export default async function TraderLoginPage() {
  const { locale, dict } = await getRequestDictionary();

  return (
    <LoginForm
      action={traderLoginAction}
      title={dict.auth.traderTitle}
      brand={dict.brand}
      hint={
        <>
          <p>{dict.auth.traderHint}</p>
          <p className="mt-2">
            <Link
              href={href("/contact", locale)}
              className="text-ro-plum hover:underline"
            >
              {dict.contact.whatsapp}
            </Link>
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
        <AdminLocaleToggle locale={locale} label={dict.common.language} />
      }
    />
  );
}
