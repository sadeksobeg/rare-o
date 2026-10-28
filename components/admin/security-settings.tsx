"use client";

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
}: {
  email: string;
  totpEnabled: boolean;
  accountLabel?: string;
  enabledLabel?: string;
  disabledLabel?: string;
  enrollLabel?: string;
}) {
  const [pending, start] = useTransition();
  const [enroll, setEnroll] = useState<{
    otpauthUrl: string;
    secret: string;
    recoveryCodes: string[];
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4 rounded-[var(--ro-r-sm)] border border-ro-line bg-ro-surface p-6">
      <p className="text-sm">
        {accountLabel}: <span dir="ltr">{email}</span>
      </p>
      <p className="text-sm text-ro-muted">
        {totpEnabled ? enabledLabel : disabledLabel}
      </p>

      {!totpEnabled && !enroll ? (
        <Button
          type="button"
          loading={pending}
          onClick={() => {
            setError(null);
            setMessage(null);
            start(async () => {
              const res = await enrollAdminTotpAction();
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setEnroll(res);
              setMessage("Scan the URI in your authenticator app, then confirm.");
            });
          }}
        >
          Start 2FA enrollment
        </Button>
      ) : null}

      {enroll ? (
        <div className="space-y-3 text-sm">
          <p className="font-medium">Manual secret (base32)</p>
          <code dir="ltr" className="block break-all rounded bg-ro-canvas p-2">
            {enroll.secret}
          </code>
          <p className="font-medium">otpauth URI</p>
          <code dir="ltr" className="block break-all rounded bg-ro-canvas p-2 text-xs">
            {enroll.otpauthUrl}
          </code>
          <p className="font-medium">Recovery codes (save once)</p>
          <ul className="list-inside list-disc font-mono text-xs">
            {enroll.recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
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
            }}
            className="space-y-3"
          >
            <TextField
              name="totpCode"
              label="Authenticator code"
              required
              dir="ltr"
              autoComplete="one-time-code"
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
