"use client";

import { useActionState, useState } from "react";
import { traderUpdatePreferencesAction } from "@/app/trader-portal-actions";
import type { ActionResult } from "@/app/actions";
import { Field, Textarea } from "@/components/ui-kit/field";
import { Banner } from "@/components/ui/banner";
import type { TraderDict } from "@/lib/ui/trader-labels";
import { cn } from "@/lib/utils";

const initial: ActionResult | null = null;

export function TraderPreferencesForm({
  labels: t,
  categories,
  selectedSlugs,
  interestNotes,
}: {
  labels: TraderDict;
  categories: Array<{ slug: string; name: string }>;
  selectedSlugs: string[];
  interestNotes: string;
}) {
  const [state, action, pending] = useActionState(
    traderUpdatePreferencesAction,
    initial
  );
  const [selected, setSelected] = useState(() => new Set(selectedSlugs));

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <form action={action} className="rad-card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--rad-tx)]">
          {t.prefsTitle}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--rad-tx3)]">{t.prefsLead}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[color:var(--rad-tx)]">
          {t.prefsCategories}
        </legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = selected.has(c.slug);
            return (
              <label key={c.slug} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="interestCategorySlugs"
                  value={c.slug}
                  checked={on}
                  onChange={() => toggle(c.slug)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-[var(--ro-dur-fast)] active:scale-[0.97]",
                    on
                      ? "border-[color:var(--rad-ac)] bg-[color:var(--rad-acs)] text-[color:var(--rad-ac)]"
                      : "border-[color:var(--rad-bd2)] bg-[color:var(--rad-surface)] text-[color:var(--rad-tx2)] hover:bg-[color:var(--rad-surface3)]"
                  )}
                >
                  {c.name}
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-[color:var(--rad-tx3)]">
          {t.prefsCategoriesHint}
        </p>
      </fieldset>

      <Field label={t.prefsNotes}>
        <Textarea
          name="interestNotes"
          rows={3}
          defaultValue={interestNotes}
          maxLength={2000}
        />
      </Field>

      {state?.ok ? <Banner tone="success">{t.prefsSaved}</Banner> : null}
      {state && !state.ok ? (
        <Banner tone="danger" alert>
          {state.error}
        </Banner>
      ) : null}

      <button type="submit" className="rad-btn rad-pri rad-sm" disabled={pending}>
        {pending ? t.submitting : t.prefsSave}
      </button>
    </form>
  );
}
