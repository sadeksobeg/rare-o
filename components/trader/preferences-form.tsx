"use client";

import { useActionState } from "react";
import { traderUpdatePreferencesAction } from "@/app/trader-portal-actions";
import type { ActionResult } from "@/app/actions";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
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
    <form action={action} className="ro-portal-card space-y-4 border p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">{t.prefsTitle}</h2>
        <p className="mt-1 text-sm text-ro-muted">{t.prefsLead}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t.prefsCategories}</legend>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label
              key={c.slug}
              className="inline-flex items-center gap-2 text-sm"
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
        <p className="text-xs text-ro-muted">{t.prefsCategoriesHint}</p>
      </fieldset>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">{t.prefsNotes}</span>
        <textarea
          name="interestNotes"
          rows={3}
          defaultValue={interestNotes}
          maxLength={2000}
          className="min-h-11 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-ro-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
        />
      </label>

      {state?.ok ? <Banner tone="success">{t.prefsSaved}</Banner> : null}
      {state && !state.ok ? (
        <Banner tone="danger" alert>
          {state.error}
        </Banner>
      ) : null}

      <Button type="submit" size="sm" loading={pending}>
        {pending ? t.submitting : t.prefsSave}
      </Button>
    </form>
  );
}
