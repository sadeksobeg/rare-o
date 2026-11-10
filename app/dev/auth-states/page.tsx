import { notFound } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getRequestDictionary } from "@/lib/i18n/server";
import { noopLoginAction } from "./noop-login-action";

export const metadata = { title: "dev: auth states" };

/**
 * Dev-only visual fixtures — REAL LoginForm split layout + forced states.
 * Single totp field (matches production). No 6-box OTP mock.
 */
export default async function DevAuthStatesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { state = "login" } = await searchParams;
  const { dict } = await getRequestDictionary();
  const a = dict.auth;

  const forced =
    state === "error" || state === "lock" || state === "2fa" || state === "recovery"
      ? state
      : null;

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 z-50 flex flex-wrap justify-center gap-2 p-3">
        {(
          [
            ["login", "أساسي"],
            ["error", "خطأ"],
            ["lock", "قفل"],
            ["2fa", "2FA"],
            ["recovery", "استعادة"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={`/dev/auth-states?state=${id}`}
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: state === id ? "var(--rad-acs)" : "rgba(11,8,13,.72)",
              color: state === id ? "var(--rad-ac)" : "#F4E7D8",
              border: "1px solid rgba(244,231,216,.2)",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
      <LoginForm
        action={noopLoginAction}
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
        forgotWhatsAppHref="https://wa.me/0000000000"
        backToSignInLabel={a.backToSignIn}
        forcedState={forced}
      />
    </div>
  );
}
