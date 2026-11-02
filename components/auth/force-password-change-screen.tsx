"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import type { ActionResult } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export function ForcePasswordChangeScreen({
  action,
  logoutAction,
  logoutLabel,
  dict,
  icon,
  portalHome,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  logoutAction: () => Promise<void>;
  logoutLabel: string;
  dict: Dictionary["forcePasswordChange"];
  icon: ReactNode;
  portalHome: string;
}) {
  const router = useRouter();

  return (
    <main className="relative flex min-h-svh items-center justify-center bg-[var(--ro-sand-100)] px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--ro-plum-900)_10%,transparent),transparent_50%),radial-gradient(ellipse_at_bottom,color-mix(in_srgb,var(--ro-amber-500)_8%,transparent),transparent_45%)]"
        aria-hidden
      />
      <form action={logoutAction} className="absolute end-6 top-6 z-10">
        <button
          type="submit"
          className="ro-icon-btn"
          aria-label={logoutLabel}
        >
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
          <span className="hidden sm:inline">{logoutLabel}</span>
        </button>
      </form>
      <div className="relative z-10 w-full max-w-md rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-paper)] p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--ro-amber-500)_18%,transparent)] text-[var(--ro-amber-800)]">
            {icon}
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-ro-ink">
              {dict.title}
            </h1>
            <p className="text-sm text-[var(--ro-ink-500)]">{dict.subtitle}</p>
          </div>
        </div>
        <p className="mb-6 rounded-md border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-3 text-sm text-[var(--ro-ink-600)]">
          {dict.explanation}
        </p>
        <ChangePasswordForm
          action={action}
          onSuccess={() => router.push(portalHome)}
          labels={dict}
        />
      </div>
    </main>
  );
}
