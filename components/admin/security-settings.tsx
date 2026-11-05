"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmAdminTotpAction,
  enrollAdminTotpAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Banner } from "@/components/ui/banner";

export function AdminSecuritySettings({
  email,
  totpEnabled,
  accountLabel = "Account",
  enabledLabel = "On",
  disabledLabel = "Off",
  enrollLabel = "Enable 2FA",
  resetLabel = "Reset 2FA",
}: {
  email: string;
  totpEnabled: boolean;
  accountLabel?: string;
  enabledLabel?: string;
  disabledLabel?: string;
  enrollLabel?: string;
  resetLabel?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [enroll, setEnroll] = useState<{
    otpauthUrl: string;
    secret: string;
    recoveryCodes: string[];
    qrDataUrl: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(totpEnabled);

  const beginEnroll = () => {
    setError(null);
    setMessage(null);
    start(async () => {
      const res = await enrollAdminTotpAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEnabled(false);
      setEnroll(res);
      setMessage(
        "Scan the QR in Google Authenticator, then enter the 6-digit code to confirm."
      );
    });
  };

  return (
    <div className="ro-portal-card space-y-4 border p-5 md:p-6">
      <p className="text-sm text-[color:var(--ro-text)]">
        {accountLabel}:{" "}
        <span dir="ltr" className="font-medium">
          {email}
        </span>
      </p>
      <p className="text-sm text-[color:var(--ro-text-muted)]">
        {enabled ? enabledLabel : disabledLabel}
      </p>

      {!enroll ? (
        <div className="flex flex-wrap gap-2">
          {!enabled ? (
            <Button type="button" loading={pending} onClick={beginEnroll}>
              {enrollLabel}
            </Button>
          ) : (
            <Button type="button" loading={pending} onClick={beginEnroll}>
              {resetLabel}
            </Button>
          )}
        </div>
      ) : null}

      {enroll ? (
        <div className="space-y-4 text-sm">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enroll.qrDataUrl}
              alt="TOTP QR code"
              width={200}
              height={200}
              className="rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-white p-2"
            />
            <p className="max-w-xs text-[color:var(--ro-text-muted)]">
              Open Google Authenticator → add account → scan this code. If
              scanning fails, enter the secret manually below. Remove any old
              RARE OUD entry first.
            </p>
          </div>

          <div>
            <p className="mb-1 font-medium text-[color:var(--ro-text)]">
              Manual secret (base32)
            </p>
            <code
              dir="ltr"
              className="block break-all rounded-[10px] bg-[color:var(--ro-bg-sunken)] px-3 py-2 font-mono text-xs text-[color:var(--ro-text)]"
            >
              {enroll.secret}
            </code>
          </div>

          <div>
            <p className="mb-1 font-medium text-[color:var(--ro-text)]">
              Recovery codes (save once)
            </p>
            <ul className="grid gap-1 rounded-[10px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] p-3 font-mono text-xs sm:grid-cols-2">
              {enroll.recoveryCodes.map((c) => (
                <li key={c} dir="ltr">
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <form
            action={async (fd) => {
              setError(null);
              const res = await confirmAdminTotpAction(null, fd);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setMessage("2FA enabled. Sign in again with your authenticator.");
              setEnroll(null);
              setEnabled(true);
              router.refresh();
            }}
            className="space-y-3"
          >
            <TextField
              name="totpCode"
              label="Authenticator code"
              required
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              pattern="[0-9 ]*"
            />
            <Button type="submit">Confirm enrollment</Button>
          </form>
        </div>
      ) : null}

      {message ? <Banner tone="success">{message}</Banner> : null}
      {error ? (
        <Banner tone="danger" alert>
          {error}
        </Banner>
      ) : null}
    </div>
  );
}
