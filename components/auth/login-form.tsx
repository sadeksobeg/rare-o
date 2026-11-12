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
  /** Dev / visual fixtures only — does not change auth actions. */
  forcedState,
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
  forcedState?: "error" | "lock" | "2fa" | "recovery" | null;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const [view, setView] = useState<"form" | "forgot">(
    forcedState === "recovery" ? "forgot" : "form"
  );
  const canForgot = Boolean(
    forgotPasswordLabel && forgotTitle && forgotSubtitle && backToSignInLabel
  );

  useEffect(() => {
    if (forcedState === "lock") {
      setLockLeft(42);
      return;
    }
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
  }, [state, forcedState]);

  const lockedCountdown = lockLeft > 0 && forcedState !== "lock";
  useEffect(() => {
    if (!lockedCountdown) return;
    const id = window.setInterval(() => {
      setLockLeft((n) => Math.max(0, n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockedCountdown]);

  const locked = lockLeft > 0 || forcedState === "lock";

  const errorText =
    forcedState === "error"
      ? (loginErrorLabel ?? "LOGIN_INVALID")
      : forcedState === "lock"
        ? `${loginLockedLabel ?? loginErrorLabel ?? "LOGIN_LOCKED"} (${formatMmSs(lockLeft || 42)})`
        : forcedState === "2fa"
          ? (totpRequiredLabel ?? totpLabel ?? "TOTP_REQUIRED")
          : state && !state.ok
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

  const showTotp = Boolean(totpLabel) || forcedState === "2fa";
  /* Admin stays dark-ceremony. Trader form follows portal light default;
     brand panel remains ink cinematic on both. */
  const authTheme = role === "trader" ? "light" : "dark";

  return (
    <MotionProvider surface={role === "admin" ? "admin" : "trader"}>
    <main
      data-portal={role === "admin" ? "admin" : "trader"}
      data-theme={authTheme}
      className={cn(
        "ro-portal grid min-h-[100dvh] w-full max-w-[100vw] grid-cols-1 overflow-x-hidden min-[901px]:grid-cols-[1.15fr_1fr]",
        role === "trader"
          ? "bg-[color:var(--rad-c0,#F5EFE6)]"
          : "bg-[color:var(--rad-c0,#0B080D)]"
      )}
    >
      {/* Living brand scene — compact ≤120px on phone; stacks below 901px */}
      <section className="relative flex max-h-[120px] min-h-[100px] flex-col justify-between overflow-hidden bg-[#0B080D] p-4 text-[var(--ro-sand-100)] min-[901px]:max-h-none min-[901px]:min-h-[100dvh] min-[901px]:self-stretch min-[901px]:p-8">
        <div
          className="pointer-events-none absolute inset-0 motion-safe:animate-[ro-portal-ambient_9s_var(--ro-ease-resonance)_infinite]"
          aria-hidden
          style={{
            background: [
              "radial-gradient(38% 46% at 24% 28%, rgba(82,39,124,0.55), transparent 60%)",
              "radial-gradient(44% 50% at 78% 70%, rgba(184,134,63,0.22), transparent 62%)",
              "radial-gradient(60% 60% at 50% 100%, rgba(50,16,79,0.65), transparent 65%)",
            ].join(","),
          }}
        />
        <div className="absolute inset-x-0 top-[8%] bottom-[34%] hidden min-[901px]:block">
          <LogoSceneMount className="h-full w-full" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xl font-semibold" style={{ fontFamily: "var(--rad-font, inherit)" }}>
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px]"
              style={{ background: "#0B080D", boxShadow: "0 0 0 1px rgba(244,231,216,.22)" }}
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-cream.png"
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px] object-contain"
                decoding="async"
              />
            </span>
            <bdi dir="ltr" className="tracking-[0.28em] text-[color:#F4E7D8]">
              {brand}
            </bdi>
          </div>
          {children}
        </div>
        <div className="relative z-10 hidden px-2 pb-2 pt-16 text-center min-[901px]:block">
          {tagline ? (
            <p className="ro-login-fade-up mb-2 text-sm text-[var(--ro-plum-300)]">
              {tagline}
            </p>
          ) : null}
          <h2
            className="mx-auto max-w-[22ch] text-balance font-display text-3xl font-semibold leading-snug text-[var(--ro-sand-100)] sm:max-w-[26ch] sm:text-4xl"
            style={{ textWrap: "balance" }}
          >
            {(() => {
              const text = headline ?? title;
              const parts = text.trim().split(/\s+/);
              if (parts.length < 2) return text;
              const last = parts.pop()!;
              return (
                <>
                  {parts.join(" ")}
                  {"\u00A0"}
                  {last}
                </>
              );
            })()}
          </h2>
        </div>
      </section>

      {/* Form panel — trader light default; admin dark ceremony */}
      <section
        className={cn(
          "relative flex min-h-0 flex-1 items-start justify-center p-5 min-[901px]:min-h-[100dvh] min-[901px]:items-center min-[901px]:p-10",
          role === "trader"
            ? "bg-[color:var(--rad-c0,#F5EFE6)]"
            : "bg-[color:var(--rad-c0,#0B080D)]"
        )}
      >
        <div
          className={cn(
            "w-full max-w-md rounded-[18px] border border-[color:var(--rad-bd2)] p-6 sm:max-w-sm sm:p-8",
            role === "trader"
              ? "bg-[color:var(--rad-surface,#FFFFFF)] shadow-[var(--rad-sh,0_1px_2px_rgba(11,8,13,.05),0_12px_28px_-20px_rgba(50,16,79,.35))]"
              : "bg-[color:var(--rad-surface,#15101A)] shadow-[var(--rad-sh,0_24px_60px_-28px_rgba(0,0,0,.7))]"
          )}
        >
          <div
            role="tablist"
            aria-label={brand}
            className="mb-6 grid grid-cols-2 gap-1 rounded-[10px] bg-[color:var(--rad-surface3)] p-1"
          >
            <Link
              href="/admin/login"
              role="tab"
              aria-selected={role === "admin"}
              className={cn(
                "rounded-[8px] px-3 py-2 text-center text-sm font-semibold transition-colors duration-[var(--ro-dur-fast)]",
                role === "admin"
                  ? "bg-[color:var(--rad-surface2)] text-[color:var(--rad-tx)] shadow-[0_1px_3px_rgba(0,0,0,.35)]"
                  : "text-[color:var(--rad-tx3)] hover:text-[color:var(--rad-tx)]"
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
                  ? "bg-[color:var(--rad-surface2)] text-[color:var(--rad-tx)] shadow-[0_1px_3px_rgba(0,0,0,.35)]"
                  : "text-[color:var(--rad-tx3)] hover:text-[color:var(--rad-tx)]"
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
                className="mb-5 text-sm text-[color:var(--rad-tx2)] underline-offset-4 hover:underline"
              >
                {backToSignInLabel}
              </button>
              <h1
                className="mb-1 text-[26px] font-semibold"
                style={{ color: "var(--rad-tx)", fontFamily: "var(--rad-font, inherit)" }}
              >
                {forgotTitle}
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-[color:var(--rad-tx2)]">
                {forgotSubtitle}
              </p>
              {forgotWhatsAppHref && forgotWhatsAppLabel ? (
                <a
                  href={forgotWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-[11px] bg-[color:var(--rad-btn)] px-4 py-3 text-sm font-semibold text-[color:var(--rad-btn-tx)] transition-opacity hover:opacity-90"
                >
                  {forgotWhatsAppLabel}
                </a>
              ) : footer ? (
                <div className="text-center text-sm text-[color:var(--rad-tx2)]">
                  {footer}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <h1
                className="mb-1 text-[26px] font-semibold"
                style={{ color: "var(--rad-tx)", fontFamily: "var(--rad-font, inherit)" }}
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="mb-6 text-sm leading-relaxed text-[color:var(--rad-tx2)]">
                  {subtitle}
                </p>
              ) : hint ? (
                <div className="mb-6 text-sm text-[color:var(--rad-tx2)]">{hint}</div>
              ) : (
                <div className="mb-6" />
              )}

              {notice ? (
                <Banner tone="info" className="mb-4">
                  {notice}
                </Banner>
              ) : null}

              {locked ? (
                <div
                  className="mb-4 flex items-start gap-2 rounded-[12px] p-3 text-sm"
                  style={{
                    background: "var(--rad-errs)",
                    color: "var(--rad-tx)",
                  }}
                >
                  <ShieldCheck
                    className="mt-0.5 size-4 shrink-0"
                    strokeWidth={1.5}
                    style={{ color: "var(--rad-err)" }}
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
                      className="text-[color:var(--rad-tx3)]"
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
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--rad-warn)" }}
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
                      className="text-sm font-semibold text-[color:var(--rad-ac)] underline-offset-4 hover:underline"
                    >
                      {forgotPasswordLabel}
                    </button>
                  </div>
                ) : null}
                {showTotp ? (
                  <TextField
                    name="totpCode"
                    type="text"
                    label={totpLabel ?? totpRequiredLabel ?? "2FA"}
                    dir="ltr"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                ) : null}
                {!locked && errorText && forcedState !== "2fa" ? (
                  <Banner tone="danger" alert aria-live="assertive">
                    {errorText}
                  </Banner>
                ) : null}
                {forcedState === "2fa" && errorText ? (
                  <p className="text-sm" style={{ color: "var(--rad-tx2)" }}>
                    {errorText}
                  </p>
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
                <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-[color:var(--rad-tx3)]">
                  <ShieldCheck
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {rateLimitFooter}
                </p>
              ) : null}

              {footer ? (
                <div className="mt-4 text-center text-sm text-[color:var(--rad-tx2)]">
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
