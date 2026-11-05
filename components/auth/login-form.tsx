"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import type { ActionResult } from "@/app/actions";
import { LogoSceneMount } from "@/components/brand/logo-scene-mount";
import { MotionProvider } from "@/components/motion/provider";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { cn } from "@/lib/utils";

const initial: ActionResult | null = null;

function formatMmSs(totalSec: number) {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/** Design-lab login ceremony wired to real admin/trader auth actions. */
export function LoginForm({
  action,
  title,
  subtitle,
  headline,
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
  children,
  totpLabel,
  returnTo,
  tagline,
  role = "admin",
  roleAdminLabel = "Admin",
  roleTraderLabel = "Trader",
  rateLimitFooter,
  capsLockLabel = "Caps Lock is on",
  notice,
  forgotPasswordLabel,
  forgotTitle,
  forgotSubtitle,
  forgotWhatsAppLabel,
  forgotWhatsAppHref,
  backToSignInLabel,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  title: string;
  /** Short line under the form title (design-lab subtitle). */
  subtitle?: string;
  /** Large words on the brand panel (design-lab headline). */
  headline?: string;
  hint?: React.ReactNode;
  footer?: React.ReactNode;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  brand?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  loginErrorLabel?: string;
  loginLockedLabel?: string;
  totpRequiredLabel?: string;
  totpInvalidLabel?: string;
  totpEnrollLabel?: string;
  children?: React.ReactNode;
  totpLabel?: string;
  returnTo?: string;
  tagline?: string;
  role?: "admin" | "trader";
  roleAdminLabel?: string;
  roleTraderLabel?: string;
  rateLimitFooter?: string;
  capsLockLabel?: string;
  /** e.g. "Your password was changed on another device. Please sign in again." */
  notice?: string;
  /** AUTH-03 — admin-managed recovery (no self-serve email reset). */
  forgotPasswordLabel?: string;
  forgotTitle?: string;
  forgotSubtitle?: string;
  forgotWhatsAppLabel?: string;
  forgotWhatsAppHref?: string | null;
  backToSignInLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const [view, setView] = useState<"form" | "forgot">("form");
  const canForgot = Boolean(
    forgotPasswordLabel && forgotTitle && forgotSubtitle && backToSignInLabel
  );

  useEffect(() => {
    if (!state || state.ok || state.error !== "LOGIN_LOCKED") {
      setLockLeft(0);
      return;
    }
    const sec =
      typeof state.data === "object" &&
      state.data &&
      "retryAfterSec" in state.data
        ? Number((state.data as { retryAfterSec?: number }).retryAfterSec)
        : 60;
    setLockLeft(Number.isFinite(sec) ? sec : 60);
  }, [state]);

  const lockedCountdown = lockLeft > 0;
  useEffect(() => {
    if (!lockedCountdown) return;
    const id = window.setInterval(() => {
      setLockLeft((n) => Math.max(0, n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockedCountdown]);

  const locked = lockLeft > 0;
  const headlineWords = (headline ?? title).split(/\s+/).filter(Boolean);

  const errorText =
    state && !state.ok
      ? state.error === "LOGIN_INVALID" ||
        state.error === "Invalid email or password"
        ? (loginErrorLabel ?? state.error)
        : state.error === "LOGIN_LOCKED"
          ? `${loginLockedLabel ?? loginErrorLabel ?? state.error}${
              locked ? ` (${formatMmSs(lockLeft)})` : ""
            }`
          : state.error === "TOTP_REQUIRED"
            ? (totpRequiredLabel ?? totpLabel ?? state.error)
            : state.error === "TOTP_INVALID"
              ? (totpInvalidLabel ?? totpLabel ?? state.error)
              : state.error === "TOTP_ENROLL_REQUIRED"
                ? (totpEnrollLabel ?? state.error)
                : state.error
      : null;

  return (
    <MotionProvider surface={role === "admin" ? "admin" : "trader"}>
    <main
      data-theme="light"
      className="ro-portal grid min-h-[100dvh] grid-cols-1 bg-[var(--ro-sand-50,#fffcf8)] md:grid-cols-[1.15fr_1fr]"
    >
      {/* Living brand scene — VISION ceremony (stacked on small screens) */}
      <section className="relative flex min-h-[44vh] flex-col justify-between overflow-hidden bg-[var(--ro-ink-950)] p-6 text-[var(--ro-sand-100)] sm:p-8 md:min-h-[100dvh]">
        <div
          className="pointer-events-none absolute inset-[-10%] motion-safe:animate-[ro-portal-ambient_9s_var(--ro-ease-resonance)_infinite]"
          aria-hidden
          style={{
            background: [
              "radial-gradient(38% 46% at 24% 28%, rgba(82,39,124,0.55), transparent 60%)",
              "radial-gradient(44% 50% at 78% 70%, rgba(184,134,63,0.22), transparent 62%)",
              "radial-gradient(60% 60% at 50% 100%, rgba(50,16,79,0.65), transparent 65%)",
            ].join(","),
          }}
        />
        <div className="absolute inset-x-0 top-[8%] bottom-[34%]">
          <LogoSceneMount className="h-full w-full" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-display text-xl font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-mark-small.svg"
              alt=""
              className="h-6 w-6 invert"
            />
            <bdi dir="ltr">{brand}</bdi>
          </div>
          {children}
        </div>
        <div className="relative z-10 rounded-t-2xl bg-gradient-to-t from-[var(--ro-ink-950)] via-[color-mix(in_srgb,var(--ro-ink-950)_70%,transparent)] to-transparent px-2 pb-2 pt-16 text-center">
          {tagline ? (
            <p className="ro-login-fade-up mb-2 text-sm text-[var(--ro-plum-300)]">
              {tagline}
            </p>
          ) : null}
          <h2 className="mx-auto max-w-[16ch] font-display text-3xl font-semibold text-[var(--ro-sand-100)] sm:text-4xl">
            {headlineWords.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="ro-login-word-in inline-block"
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                {word}
                {i < headlineWords.length - 1 ? "\u00a0" : null}
              </span>
            ))}
          </h2>
        </div>
      </section>

      {/* Form panel — light default (never inherit portal dark remaps) */}
      <section className="relative flex items-center justify-center bg-[var(--ro-sand-100,#f8f4ee)] p-6 md:p-10">
        <div className="w-full max-w-sm rounded-[14px] border border-[color:rgba(50,16,79,0.08)] bg-[var(--ro-sand-50,#fffcf8)] p-8 shadow-[inset_0_1px_0_rgba(255,252,248,.9),0_1px_2px_rgba(11,8,13,.06),0_8px_24px_-12px_rgba(11,8,13,.14)]">
          <div
            role="tablist"
            aria-label={brand}
            className="mb-6 grid grid-cols-2 gap-1 rounded-[10px] bg-[color-mix(in_srgb,var(--ro-ink-950)_6%,transparent)] p-1"
          >
            <Link
              href="/admin/login"
              role="tab"
              aria-selected={role === "admin"}
              className={cn(
                "rounded-[8px] px-3 py-2 text-center text-sm font-semibold transition-colors duration-[var(--ro-dur-fast)]",
                role === "admin"
                  ? "bg-[var(--ro-sand-50)] text-ro-ink shadow-[0_1px_2px_rgba(11,8,13,.08)]"
                  : "text-[var(--ro-ink-600)] hover:text-ro-ink"
              )}
            >
              {roleAdminLabel}
            </Link>
            <Link
              href="/trader/login"
              role="tab"
              aria-selected={role === "trader"}
              className={cn(
                "rounded-[8px] px-3 py-2 text-center text-sm font-semibold transition-colors duration-[var(--ro-dur-fast)]",
                role === "trader"
                  ? "bg-[var(--ro-sand-50)] text-ro-ink shadow-[0_1px_2px_rgba(11,8,13,.08)]"
                  : "text-[var(--ro-ink-600)] hover:text-ro-ink"
              )}
            >
              {roleTraderLabel}
            </Link>
          </div>

          {view === "forgot" && canForgot ? (
            <>
              <button
                type="button"
                onClick={() => setView("form")}
                className="mb-5 text-sm text-[var(--ro-ink-600)] underline-offset-4 hover:underline"
              >
                {backToSignInLabel}
              </button>
              <h1 className="mb-1 font-display text-2xl font-semibold text-ro-ink">
                {forgotTitle}
              </h1>
              <p className="mb-6 text-sm text-[var(--ro-ink-600)]">
                {forgotSubtitle}
              </p>
              {forgotWhatsAppHref && forgotWhatsAppLabel ? (
                <a
                  href={forgotWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-[10px] bg-[var(--ro-plum-900)] px-4 py-3 text-sm font-semibold text-[var(--ro-sand-50)] transition-opacity hover:opacity-90"
                >
                  {forgotWhatsAppLabel}
                </a>
              ) : footer ? (
                <div className="text-center text-sm text-[var(--ro-ink-600)]">
                  {footer}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <h1 className="mb-1 font-display text-2xl font-semibold text-ro-ink">
                {title}
              </h1>
              {subtitle ? (
                <p className="mb-6 text-sm text-[var(--ro-ink-600)]">{subtitle}</p>
              ) : hint ? (
                <div className="mb-6 text-sm text-[var(--ro-ink-600)]">{hint}</div>
              ) : (
                <div className="mb-6" />
              )}

              {notice ? (
                <Banner tone="info" className="mb-4">
                  {notice}
                </Banner>
              ) : null}

              {locked ? (
                <div className="mb-4 flex items-start gap-2 rounded-[8px] bg-[var(--ro-danger-100)] p-3 text-sm text-[var(--ro-danger-700)]">
                  <ShieldCheck
                    className="mt-0.5 size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span>{errorText}</span>
                </div>
              ) : null}

              <form
                action={formAction}
                className={cn(
                  "space-y-4",
                  locked && "pointer-events-none opacity-50"
                )}
              >
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
                  inputMode="email"
                  autoFocus
                />
                <TextField
                  name="password"
                  type={reveal ? "text" : "password"}
                  label={passwordLabel}
                  required
                  minLength={8}
                  dir="ltr"
                  autoComplete="current-password"
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  endAdornment={
                    <button
                      type="button"
                      className="text-[var(--ro-ink-600)]"
                      onClick={() => setReveal((v) => !v)}
                      aria-pressed={reveal}
                      aria-label={
                        reveal ? hidePasswordLabel : showPasswordLabel
                      }
                    >
                      {reveal ? (
                        <EyeOff
                          className="size-5"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      ) : (
                        <Eye className="size-5" strokeWidth={1.5} aria-hidden />
                      )}
                    </button>
                  }
                />
                {capsLock ? (
                  <p
                    className="flex items-center gap-1.5 text-xs text-[var(--ro-amber-800)]"
                    role="status"
                  >
                    <AlertTriangle
                      className="size-4"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {capsLockLabel}
                  </p>
                ) : null}
                {canForgot ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-sm font-medium text-[var(--ro-plum-900)] underline-offset-4 hover:underline"
                    >
                      {forgotPasswordLabel}
                    </button>
                  </div>
                ) : null}
                {totpLabel ? (
                  <TextField
                    name="totpCode"
                    type="text"
                    label={totpLabel}
                    dir="ltr"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                ) : null}
                {!locked && errorText ? (
                  <Banner tone="danger" alert aria-live="assertive">
                    {errorText}
                  </Banner>
                ) : null}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={pending}
                  disabled={locked || pending}
                >
                  {submitLabel}
                </Button>
              </form>

              {rateLimitFooter ? (
                <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--ro-ink-600)]">
                  <ShieldCheck
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {rateLimitFooter}
                </p>
              ) : null}

              {footer ? (
                <div className="mt-4 text-center text-sm text-[var(--ro-ink-600)]">
                  {footer}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
    </MotionProvider>
  );
}
