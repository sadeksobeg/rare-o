"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ActionResult } from "@/app/actions";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";

function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const scoreClass = [
  "bg-[var(--ro-danger-700)]",
  "bg-[var(--ro-amber-500)]",
  "bg-[var(--ro-amber-500)]",
  "bg-[#1F5130]",
  "bg-[#1F5130]",
];

export type ChangePasswordLabels = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  mismatch: string;
  submit: string;
  strengthLabel: string;
  strengthWeak: string;
  strengthFair: string;
  strengthGood: string;
  strengthStrong: string;
  strengthVeryStrong: string;
  ruleLength: string;
  ruleNotTemp: string;
  ruleNotEmail: string;
  errorCurrentWrong: string;
  errorWeak: string;
  errorSameAsTemp: string;
  errorSameAsEmail: string;
  showPassword: string;
  hidePassword: string;
};

const errorKeyFor: Record<string, keyof ChangePasswordLabels | null> = {
  CURRENT_WRONG: "errorCurrentWrong",
  WEAK: "errorWeak",
  SAME_AS_CURRENT: "errorSameAsTemp",
  SAME_AS_EMAIL: "errorSameAsEmail",
  MISMATCH: "mismatch",
};

export function ChangePasswordForm({
  action,
  labels,
  onSuccess,
  submitClassName,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  labels: ChangePasswordLabels;
  onSuccess?: () => void;
  submitClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    null as ActionResult | null
  );
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const score = useMemo(() => passwordScore(password), [password]);
  const mismatch = confirm.length > 0 && password !== confirm;
  const strengthLabels = [
    labels.strengthWeak,
    labels.strengthFair,
    labels.strengthGood,
    labels.strengthStrong,
    labels.strengthVeryStrong,
  ];

  useEffect(() => {
    if (state?.ok) onSuccess?.();
  }, [state, onSuccess]);

  const errorText =
    state && !state.ok && state.error
      ? errorKeyFor[state.error]
        ? labels[errorKeyFor[state.error]!]
        : labels.errorWeak
      : null;

  return (
    <form action={formAction} className="space-y-4">
      <TextField
        name="currentPassword"
        type="password"
        label={labels.currentPassword}
        dir="ltr"
        required
        autoFocus
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <div className="space-y-1.5">
        <TextField
          name="newPassword"
          type={reveal ? "text" : "password"}
          label={labels.newPassword}
          dir="ltr"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          endAdornment={
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="text-xs text-[var(--ro-ink-500)]"
              aria-label={reveal ? labels.hidePassword : labels.showPassword}
            >
              {reveal ? (
                <EyeOff className="size-4" strokeWidth={1.5} />
              ) : (
                <Eye className="size-4" strokeWidth={1.5} />
              )}
            </button>
          }
        />
        {password.length > 0 ? (
          <div className="space-y-1">
            <div className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-[var(--ro-sand-200)]">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-full flex-1 rounded-full transition-colors ${
                    i <= score ? scoreClass[score] : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--ro-ink-500)]">
              {labels.strengthLabel}: {strengthLabels[score]}
            </p>
          </div>
        ) : null}
        <ul className="space-y-0.5 text-xs text-[var(--ro-ink-500)]">
          <li className={password.length >= 10 ? "text-[#1F5130]" : ""}>
            {labels.ruleLength}
          </li>
          <li
            className={
              password.length > 0 && password !== current ? "text-[#1F5130]" : ""
            }
          >
            {labels.ruleNotTemp}
          </li>
          <li>{labels.ruleNotEmail}</li>
        </ul>
      </div>
      <TextField
        name="confirmPassword"
        type={reveal ? "text" : "password"}
        label={labels.confirmPassword}
        dir="ltr"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={mismatch ? labels.mismatch : undefined}
      />
      {errorText ? (
        <Banner tone="danger">{errorText}</Banner>
      ) : null}
      <Button
        type="submit"
        loading={pending}
        disabled={mismatch || password.length < 10}
        className={submitClassName ?? "w-full"}
      >
        {labels.submit}
      </Button>
    </form>
  );
}
