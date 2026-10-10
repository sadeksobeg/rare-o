"use client";

import { traderCreateDealAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Banner } from "@/components/ui/banner";
import type { Locale } from "@/lib/i18n/config";
import type { TraderDict } from "@/lib/ui/trader-labels";
import { useActionState, useState } from "react";

const initial: ActionResult | null = null;

const control =
  "min-h-11 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-ro-ink outline-none focus:border-[var(--ro-plum-900)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--ro-focus)]";

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 border border-ro-line bg-ro-surface p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-7 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-xs font-semibold text-[var(--ro-plum-900)]"
        >
          {step}
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </fieldset>
  );
}

export function NewDealForm({
  products,
  labels: t,
  locale,
}: {
  products: Array<{ id: string; nameEn: string; nameAr: string; slug: string }>;
  labels: TraderDict;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(
    traderCreateDealAction,
    initial
  );
  const [kind, setKind] = useState<"catalog" | "non_catalog">("catalog");

  return (
    <form action={action} className="mx-auto max-w-xl space-y-4">
      <Section step={1} title={t.sectionType}>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">{t.dealTypeLabel}</span>
          <select
            name="dealKind"
            value={kind}
            onChange={(e) =>
              setKind(e.target.value as "catalog" | "non_catalog")
            }
            className={control}
          >
            <option value="catalog">{t.dealKind.catalog}</option>
            <option value="non_catalog">{t.dealKind.non_catalog}</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">{t.dealTitleLabel}</span>
          <input name="title" required maxLength={200} className={control} />
        </label>
        {kind === "catalog" ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{t.productLabel}</span>
            <select name="productId" required className={control}>
              <option value="">{t.productPlaceholder}</option>
              {products.map((p) => {
                const name =
                  locale === "ar"
                    ? p.nameAr || p.nameEn
                    : p.nameEn || p.nameAr;
                return (
                  <option key={p.id} value={p.id}>
                    {name} ({p.slug})
                  </option>
                );
              })}
            </select>
          </label>
        ) : (
          <p className="text-sm text-ro-muted">{t.nonCatalogNote}</p>
        )}
      </Section>

      <Section step={2} title={t.sectionTerms}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{t.priceOptional}</span>
            <input
              name="proposedPrice"
              type="number"
              step="0.01"
              min="0"
              dir="ltr"
              className={control}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{t.currencyLabel}</span>
            <input
              name="currency"
              placeholder="USD"
              dir="ltr"
              className={control}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{t.quantityLabel}</span>
            <input
              name="quantity"
              type="number"
              min="1"
              dir="ltr"
              className={control}
            />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">{t.conditionsLabel}</span>
          <textarea name="conditionsNotes" rows={3} className={control} />
        </label>
      </Section>

      <Section step={3} title={t.sectionMessage}>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">{t.initialMessageLabel}</span>
          <textarea name="message" rows={3} className={control} />
        </label>
      </Section>

      {state && !state.ok ? (
        <Banner tone="danger" alert>
          {state.error}
        </Banner>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full bg-ro-purple px-5 text-sm text-ro-ivory disabled:opacity-60 sm:w-auto"
      >
        {pending ? t.submitting : t.submitProposal}
      </button>
    </form>
  );
}
