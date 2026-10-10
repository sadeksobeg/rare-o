"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/app/actions";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Rings } from "@/components/brand";

const initial: ActionResult | null = null;

export function LoginForm({
  action,
  title,
  hint,
  emailLabel,
  passwordLabel,
  submitLabel,
  inverse = false,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  title: string;
  hint?: string;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  inverse?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <div
      className={
        inverse
          ? "ro-inverse flex min-h-screen items-center justify-center px-4"
          : "flex min-h-screen items-center justify-center bg-ro-canvas px-4"
      }
    >
      <div className="relative w-full max-w-[420px]">
        {inverse ? (
          <Rings className="pointer-events-none absolute inset-0 -z-0 m-auto h-64 w-64 opacity-20" />
        ) : null}
        <form
          action={formAction}
          className="relative space-y-4 rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-8 text-ro-ink"
        >
          <h1 className="text-2xl tracking-[0.12em]">{title}</h1>
          {hint ? <p className="text-sm text-ro-muted">{hint}</p> : null}
          <TextField
            name="email"
            type="email"
            label={emailLabel}
            required
            dir="ltr"
            autoComplete="username"
          />
          <TextField
            name="password"
            type="password"
            label={passwordLabel}
            required
            minLength={8}
            dir="ltr"
            autoComplete="current-password"
          />
          {state && !state.ok ? (
            <Banner tone="danger" alert>
              {state.error}
            </Banner>
          ) : null}
          <Button type="submit" className="w-full" loading={pending}>
            {submitLabel}
          </Button>
        </form>
      </div>
    </div>
  );
}
