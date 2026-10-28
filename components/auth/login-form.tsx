"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import type { ActionResult } from "@/app/actions";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Grain, Rings } from "@/components/brand";
import { DrawIn, RosetteMark } from "@/components/motion/draw-in";
import { Reveal } from "@/components/motion/reveal";
import { useAmbientMotion } from "@/components/motion/use-ambient";

const initial: ActionResult | null = null;

export function LoginForm({
  action,
  title,
  hint,
  footer,
  emailLabel,
  passwordLabel,
  submitLabel,
  brand = "RARE OUD",
  showPasswordLabel = "Show",
  hidePasswordLabel = "Hide",
  loginErrorLabel,
  loginLockedLabel,
  totpRequiredLabel,
  totpInvalidLabel,
  totpEnrollLabel,
  inverse = false,
  children,
  totpLabel,
  returnTo,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  title: string;
  hint?: React.ReactNode;
  footer?: React.ReactNode;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  brand?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  /** Localized generic credentials error (maps LOGIN_INVALID). */
  loginErrorLabel?: string;
  loginLockedLabel?: string;
  totpRequiredLabel?: string;
  totpInvalidLabel?: string;
  totpEnrollLabel?: string;
  inverse?: boolean;
  children?: React.ReactNode;
  /** When set, show optional TOTP / recovery code field (admin 2FA). */
  totpLabel?: string;
  returnTo?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [reveal, setReveal] = useState(false);
  const { active, resume } = useAmbientMotion();

  const errorText =
    state && !state.ok
      ? state.error === "LOGIN_INVALID" ||
        state.error === "Invalid email or password"
        ? (loginErrorLabel ?? state.error)
        : state.error === "LOGIN_LOCKED"
          ? (loginLockedLabel ?? loginErrorLabel ?? state.error)
          : state.error === "TOTP_REQUIRED"
            ? (totpRequiredLabel ?? totpLabel ?? state.error)
            : state.error === "TOTP_INVALID"
              ? (totpInvalidLabel ?? totpLabel ?? state.error)
              : state.error === "TOTP_ENROLL_REQUIRED"
                ? (totpEnrollLabel ?? state.error)
                : state.error
      : null;

  return (
    <div
      className={
        inverse
          ? "ro-inverse ro-login-stage fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-[var(--ro-ink-950)] px-4 py-12"
          : "relative flex min-h-screen items-center justify-center bg-ro-canvas px-4 py-12"
      }
      onPointerDown={resume}
    >
      {inverse ? (
        <>
          <div className="ro-login-glow" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(50,16,79,0.45), transparent 70%)",
            }}
            aria-hidden="true"
          />
          <Grain
            patternId="ro-login-grain"
            className="absolute inset-0 z-0 text-ro-canvas opacity-[0.06]"
          />
          <div
            className="ro-login-rings pointer-events-none absolute inset-0 z-0 m-auto h-[min(70vw,28rem)] w-[min(70vw,28rem)]"
            data-ambient={active ? "on" : "off"}
          >
            <Rings className="h-full w-full text-ro-canvas opacity-[0.14]" />
          </div>
        </>
      ) : null}

      {children ? (
        <div className="absolute end-4 top-4 z-10">{children}</div>
      ) : null}

      <Reveal variant="up" className="relative w-full max-w-[420px]">
        <form
          action={formAction}
          className="relative space-y-5 rounded-[var(--ro-r-sm)] border border-[var(--ro-sand-200)] bg-[var(--ro-sand-50)] p-8 text-ro-ink shadow-[0_24px_60px_-36px_rgba(11,8,13,0.55)]"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <DrawIn durationMs={900} className="size-16">
              <RosetteMark width={64} height={64} />
            </DrawIn>
            <p className="font-display text-sm font-bold tracking-[0.28em]">
              {brand}
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <KeyRound
                className="size-5 shrink-0 text-[var(--ro-plum-800)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              {title}
            </h1>
            {hint ? (
              <div className="text-sm font-medium text-[var(--ro-ink-700)]">
                {hint}
              </div>
            ) : null}
          </div>

          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
          <TextField
            name="email"
            type="email"
            label={emailLabel}
            required
            dir="ltr"
            autoComplete="username"
            autoFocus
            startAdornment={<Mail className="size-4" strokeWidth={2} />}
          />
          <TextField
            name="password"
            type={reveal ? "text" : "password"}
            label={passwordLabel}
            required
            minLength={8}
            dir="ltr"
            autoComplete="current-password"
            startAdornment={<Lock className="size-4" strokeWidth={2} />}
            endAdornment={
              <button
                type="button"
                className="ro-icon-btn h-8 min-h-0 gap-1 px-2 text-xs"
                data-tone="ghost"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? hidePasswordLabel : showPasswordLabel}
              >
                {reveal ? (
                  <EyeOff className="size-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="size-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {reveal ? hidePasswordLabel : showPasswordLabel}
                </span>
              </button>
            }
          />
          {totpLabel ? (
            <TextField
              name="totpCode"
              type="text"
              label={totpLabel}
              dir="ltr"
              autoComplete="one-time-code"
              inputMode="numeric"
              startAdornment={
                <ShieldCheck className="size-4" strokeWidth={2} />
              }
            />
          ) : null}
          {errorText ? (
            <Banner tone="danger" alert className="ro-banner-shake">
              {errorText}
            </Banner>
          ) : null}
          <Button type="submit" className="w-full" loading={pending}>
            {submitLabel}
          </Button>
        </form>
        {footer ? (
          <div className="relative mt-5 text-center text-sm font-medium text-[color-mix(in_srgb,var(--ro-sand-100)_82%,transparent)]">
            {footer}
          </div>
        ) : null}
      </Reveal>
    </div>
  );
}
