"use client";

import { traderCreateDealAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Banner } from "@/components/ui/banner";
import { Wizard } from "@/components/ui/wizard";
import type { Locale } from "@/lib/i18n/config";
import { fmt, type TraderDict } from "@/lib/ui/trader-labels";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

const initial: ActionResult | null = null;
const DRAFT_KEY = "ro-trader-deal-draft";

const control =
  "min-h-11 w-full rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 py-2 text-ro-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]";

type Draft = {
  step: number;
  dealKind: "catalog" | "non_catalog";
  title: string;
  productId: string;
  message: string;
  proposedPrice: string;
  currency: string;
  quantity: string;
  conditionsNotes: string;
};

const emptyDraft = (): Draft => ({
  step: 0,
  dealKind: "catalog",
  title: "",
  productId: "",
  message: "",
  proposedPrice: "",
  currency: "",
  quantity: "",
  conditionsNotes: "",
});

function isDirty(d: Draft) {
  return Boolean(
    d.title.trim() ||
      d.productId ||
      d.message.trim() ||
      d.proposedPrice ||
      d.currency ||
      d.quantity ||
      d.conditionsNotes.trim() ||
      d.dealKind !== "catalog"
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
  const router = useRouter();
  const [state, action, pending] = useActionState(
    traderCreateDealAction,
    initial
  );
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok || !state.data || typeof state.data !== "object") return;
    const id = (state.data as { id?: string }).id;
    if (!id || navigating) return;
    setNavigating(true);
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    router.push(`/trader/deals/${id}`);
  }, [state, router, navigating]);

  const steps = useMemo(
    () => [
      { id: "request", title: t.sectionType },
      { id: "terms", title: t.sectionTerms },
      { id: "review", title: t.sectionReview },
    ],
    [t.sectionType, t.sectionTerms, t.sectionReview]
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Draft>;
        setDraft({ ...emptyDraft(), ...parsed, step: parsed.step ?? 0 });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isDirty(draft) || draft.step > 0) {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [draft, hydrated]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty(draft)) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [draft]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!a || !isDirty(draft)) return;
      if (!window.confirm(t.wizardLeaveConfirm)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [draft, t.wizardLeaveConfirm]);

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
    setStepError(null);
  }

  function validateStep(step: number): boolean {
    if (step === 0) {
      if (!draft.title.trim()) {
        setStepError(t.wizardNeedTitle);
        return false;
      }
      if (draft.dealKind === "catalog" && !draft.productId) {
        setStepError(t.wizardNeedProduct);
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateStep(draft.step)) return;
    patch({ step: Math.min(draft.step + 1, steps.length - 1) });
  }

  function goBack() {
    patch({ step: Math.max(draft.step - 1, 0) });
  }

  function productName(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return id;
    return locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr;
  }

  const stepOfLabel = fmt(t.wizardStepOf, {
    current: draft.step + 1,
    total: steps.length,
  });

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => {
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
      }}
      className="space-y-4"
    >
      <input type="hidden" name="dealKind" value={draft.dealKind} />
      <input type="hidden" name="title" value={draft.title} />
      {draft.dealKind === "catalog" ? (
        <input type="hidden" name="productId" value={draft.productId} />
      ) : null}
      <input type="hidden" name="message" value={draft.message} />
      <input type="hidden" name="proposedPrice" value={draft.proposedPrice} />
      <input type="hidden" name="currency" value={draft.currency} />
      <input type="hidden" name="quantity" value={draft.quantity} />
      <input
        type="hidden"
        name="conditionsNotes"
        value={draft.conditionsNotes}
      />

      <Wizard
        steps={steps}
        current={draft.step}
        stepOfLabel={stepOfLabel}
        backLabel={t.wizardBack}
        nextLabel={t.wizardNext}
        onBack={draft.step > 0 ? goBack : undefined}
        onNext={draft.step < steps.length - 1 ? goNext : undefined}
        hideNext={draft.step === steps.length - 1}
        footer={
          draft.step === steps.length - 1 ? (
            <button
              type="submit"
              disabled={pending || navigating}
              className="min-h-11 bg-ro-purple px-5 text-sm text-ro-ivory disabled:opacity-60"
            >
              {pending || navigating ? t.submitting : t.submitProposal}
            </button>
          ) : null
        }
      >
        {draft.step === 0 ? (
          <fieldset className="space-y-4 border border-ro-line bg-ro-surface p-4 sm:p-5">
            <legend className="sr-only">{t.sectionType}</legend>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">{t.dealTypeLabel}</span>
              <select
                value={draft.dealKind}
                onChange={(e) =>
                  patch({
                    dealKind: e.target.value as "catalog" | "non_catalog",
                    productId: "",
                  })
                }
                className={control}
              >
                <option value="catalog">{t.dealKind.catalog}</option>
                <option value="non_catalog">{t.dealKind.non_catalog}</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">{t.dealTitleLabel}</span>
              <input
                required
                maxLength={200}
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                className={control}
              />
            </label>
            {draft.dealKind === "catalog" ? (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">{t.productLabel}</span>
                <select
                  value={draft.productId}
                  onChange={(e) => patch({ productId: e.target.value })}
                  className={control}
                >
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
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">{t.initialMessageLabel}</span>
              <textarea
                rows={3}
                value={draft.message}
                onChange={(e) => patch({ message: e.target.value })}
                className={control}
              />
            </label>
          </fieldset>
        ) : null}

        {draft.step === 1 ? (
          <fieldset className="space-y-4 border border-ro-line bg-ro-surface p-4 sm:p-5">
            <legend className="sr-only">{t.sectionTerms}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">{t.priceOptional}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  dir="ltr"
                  value={draft.proposedPrice}
                  onChange={(e) => patch({ proposedPrice: e.target.value })}
                  className={control}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">{t.currencyLabel}</span>
                <input
                  placeholder="USD"
                  dir="ltr"
                  value={draft.currency}
                  onChange={(e) => patch({ currency: e.target.value })}
                  className={control}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">{t.quantityLabel}</span>
                <input
                  type="number"
                  min="1"
                  dir="ltr"
                  value={draft.quantity}
                  onChange={(e) => patch({ quantity: e.target.value })}
                  className={control}
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">{t.conditionsLabel}</span>
              <textarea
                rows={3}
                value={draft.conditionsNotes}
                onChange={(e) => patch({ conditionsNotes: e.target.value })}
                className={control}
              />
            </label>
          </fieldset>
        ) : null}

        {draft.step === 2 ? (
          <div className="space-y-4 border border-ro-line bg-ro-surface p-4 sm:p-5">
            <ReviewRow
              label={t.sectionType}
              onEdit={() => patch({ step: 0 })}
              editLabel={t.wizardEdit}
            >
              <p>
                {t.dealKind[draft.dealKind] ?? draft.dealKind}
                {" · "}
                {draft.title || "—"}
              </p>
              {draft.dealKind === "catalog" && draft.productId ? (
                <p className="text-sm text-ro-muted">
                  {productName(draft.productId)}
                </p>
              ) : null}
              {draft.message ? (
                <p className="mt-2 text-sm text-ro-muted">{draft.message}</p>
              ) : null}
            </ReviewRow>
            <ReviewRow
              label={t.sectionTerms}
              onEdit={() => patch({ step: 1 })}
              editLabel={t.wizardEdit}
            >
              <ul className="space-y-1 text-sm">
                <li>
                  {t.priceOptional}:{" "}
                  {draft.proposedPrice
                    ? `${draft.proposedPrice}${draft.currency ? ` ${draft.currency}` : ""}`
                    : "—"}
                </li>
                <li>
                  {t.quantityLabel}: {draft.quantity || "—"}
                </li>
                {draft.conditionsNotes ? (
                  <li>
                    {t.conditionsLabel}: {draft.conditionsNotes}
                  </li>
                ) : null}
              </ul>
            </ReviewRow>
          </div>
        ) : null}
      </Wizard>

      {stepError ? (
        <Banner tone="danger" alert>
          {stepError}
        </Banner>
      ) : null}
      {state && !state.ok ? (
        <Banner tone="danger" alert>
          {state.error}
        </Banner>
      ) : null}
    </form>
  );
}

function ReviewRow({
  label,
  onEdit,
  editLabel,
  children,
}: {
  label: string;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 border-b border-ro-line pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-ro-plum hover:underline"
        >
          {editLabel}
        </button>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
