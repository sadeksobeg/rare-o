"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/app/actions";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Grain, Rings } from "@/components/brand";
import { BrandMark } from "@/components/storefront/brand-mark";

const initial: ActionResult | null = null;

export function LoginForm({
  action,
  title,
  hint,
  emailLabel,
  passwordLabel,
  submitLabel,
  brand = "RARE OUD",
  showPasswordLabel = "Show",
  hidePasswordLabel = "Hide",
  inverse = false,
  localeSlot,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  title: string;
  hint?: React.ReactNode;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  brand?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  inverse?: boolean;
  localeSlot?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const [reveal, setReveal] = useState(false);

  return (
    <div
      className={
        inverse
          ? "ro-inverse fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-[var(--ro-ink-950)] px-4 py-12"
          : "relative flex min-h-screen items-center justify-center bg-ro-canvas px-4 py-12"
      }
    >
      {inverse ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(50,16,79,0.45), transparent 70%)",
            }}
            aria-hidden
          />
          <Grain className="absolute inset-0 text-ro-canvas opacity-[0.06]" />
          <Rings className="pointer-events-none absolute inset-0 m-auto h-[min(70vw,28rem)] w-[min(70vw,28rem)] text-ro-canvas opacity-[0.12]" />
        </>
      ) : null}

      {localeSlot ? (
        <div className="absolute end-4 top-4 z-10">{localeSlot}</div>
      ) : null}

      <div className="relative w-full max-w-[420px]">
        <form
          action={formAction}
          className="relative space-y-5 rounded-[var(--ro-r-sm)] border border-[var(--ro-sand-200)] bg-[var(--ro-sand-50)] p-8 text-ro-ink shadow-none"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <BrandMark variant="master" tone="on-light" size="md" />
            <p className="font-display text-sm tracking-[0.28em]">{brand}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {hint ? (
              <div className="text-sm text-ro-muted">{hint}</div>
            ) : null}
          </div>

          <TextField
            name="email"
            type="email"
            label={emailLabel}
            required
            dir="ltr"
            autoComplete="username"
          />
          <div className="relative">
            <TextField
              name="password"
              type={reveal ? "text" : "password"}
              label={passwordLabel}
              required
              minLength={8}
              dir="ltr"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute end-3 top-[2.35rem] z-10 text-xs font-medium text-ro-plum hover:underline"
              onClick={() => setReveal((v) => !v)}
            >
              {reveal ? hidePasswordLabel : showPasswordLabel}
            </button>
          </div>
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
