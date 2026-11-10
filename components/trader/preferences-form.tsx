"use client";

import { useActionState } from "react";
import { traderUpdatePreferencesAction } from "@/app/trader-portal-actions";
import type { ActionResult } from "@/app/actions";
import { Field, Textarea } from "@/components/ui-kit/field";
import { Banner } from "@/components/ui/banner";
import type { TraderDict } from "@/lib/ui/trader-labels";

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
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label
              key={c.slug}
              className="inline-flex items-center gap-2 text-sm text-[color:var(--rad-tx)]"
            >
              <input
                type="checkbox"
                name="interestCategorySlugs"
                value={c.slug}
                defaultChecked={selectedSlugs.includes(c.slug)}
              />
              <span>{c.name}</span>
            </label>
          ))}
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
