"use client";

import { traderCreateDealAction } from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import {
  ProductPicker,
  type PickerProduct,
} from "@/components/trader/product-picker";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Wizard } from "@/components/ui/wizard";
import { Field, Input, Select, Textarea } from "@/components/ui-kit/field";
import { coercePlatformCurrency } from "@/lib/catalog/currency";
import type { Locale } from "@/lib/i18n/config";
import { fmt, traderActionMessage, type TraderDict } from "@/lib/ui/trader-labels";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

const initial: ActionResult | null = null;
const DRAFT_KEY = "ro-trader-deal-draft";

type Draft = {
  step: number;
  dealKind: "catalog" | "non_catalog";
  title: string;
  productId: string;
  message: string;
  modelNumber: string;
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
  modelNumber: "",
  proposedPrice: "",
  currency: "USD",
  quantity: "",
  conditionsNotes: "",
});

function isDirty(d: Draft) {
  return Boolean(
    d.title.trim() ||
      d.productId ||
      d.message.trim() ||
      d.modelNumber.trim() ||
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
  initialTitle = "",
}: {
  products: Array<PickerProduct & { currency?: string | null }>;
  labels: TraderDict;
  locale: Locale;
  initialTitle?: string;
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
  const [successId, setSuccessId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok || !state.data || typeof state.data !== "object") return;
    const id = (state.data as { id?: string }).id;
    if (!id || navigating || successId) return;
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setSuccessId(id);
  }, [state, navigating, successId]);

  useEffect(() => {
    if (!successId) return;
    const handle = window.setTimeout(() => {
      setNavigating(true);
      router.push(`/trader/deals/${successId}`);
    }, 1600);
    return () => window.clearTimeout(handle);
  }, [successId, router]);

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
      } else if (initialTitle.trim()) {
        setDraft({ ...emptyDraft(), title: initialTitle.trim().slice(0, 200) });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [initialTitle]);

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
    if (step === 1) {
      if (!draft.modelNumber.trim()) {
        setStepError(t.wizardNeedModel);
        return false;
      }
      if (!draft.proposedPrice.trim() || Number(draft.proposedPrice) <= 0) {
        setStepError(t.wizardNeedPrice);
        return false;
      }
      if (!draft.currency.trim()) {
        setStepError(t.wizardNeedCurrency);
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
      className="max-w-full space-y-4 overflow-x-clip"
    >
      <input type="hidden" name="dealKind" value={draft.dealKind} />
      <input type="hidden" name="title" value={draft.title} />
      {draft.dealKind === "catalog" ? (
        <input type="hidden" name="productId" value={draft.productId} />
      ) : null}
      <input type="hidden" name="message" value={draft.message} />
      <input type="hidden" name="modelNumber" value={draft.modelNumber} />
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
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={pending || navigating}
            >
              {pending || navigating ? t.submitting : t.submitProposal}
            </Button>
          ) : null
        }
      >
        {draft.step === 0 ? (
          <fieldset className="min-w-0 space-y-4 p-1 sm:p-0">
            <legend className="sr-only">{t.sectionType}</legend>
            <Field label={t.dealTypeLabel}>
              <Select
                value={draft.dealKind}
                onChange={(e) =>
                  patch({
                    dealKind: e.target.value as "catalog" | "non_catalog",
                    productId: "",
                  })
                }
              >
                <option value="catalog">{t.dealKind.catalog}</option>
                <option value="non_catalog">{t.dealKind.non_catalog}</option>
              </Select>
            </Field>
            <Field label={t.dealTitleLabel}>
              <Input
                required
                maxLength={200}
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </Field>
            {draft.dealKind === "catalog" ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{t.productLabel}</p>
                <ProductPicker
                  variant="single"
                  products={products}
                  qtyById={draft.productId ? { [draft.productId]: 1 } : {}}
                  onQtyChange={(id, qty) => {
                    if (qty < 1) {
                      patch({ productId: "" });
                      return;
                    }
                    const p = products.find((x) => x.id === id);
                    patch({
                      productId: id,
                      currency: coercePlatformCurrency(
                        p?.currency || draft.currency
                      ),
                    });
                  }}
                  labels={t}
                  locale={locale}
                />
              </div>
            ) : (
              <p className="text-sm text-ro-muted">{t.nonCatalogNote}</p>
            )}
            <Field label={t.initialMessageLabel}>
              <Textarea
                rows={3}
                value={draft.message}
                onChange={(e) => patch({ message: e.target.value })}
              />
            </Field>
          </fieldset>
        ) : null}

        {draft.step === 1 ? (
          <fieldset className="min-w-0 space-y-4 p-1 sm:p-0">
            <legend className="sr-only">{t.sectionTerms}</legend>
            <Field label={t.modelNumberLabel}>
              <Input
                type="text"
                required
                maxLength={120}
                dir="ltr"
                value={draft.modelNumber}
                onChange={(e) => patch({ modelNumber: e.target.value })}
              />
            </Field>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label={t.priceOptional}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  dir="ltr"
                  value={draft.proposedPrice}
                  onChange={(e) => patch({ proposedPrice: e.target.value })}
                />
              </Field>
              <CurrencySelect
                name="currencyUi"
                required
                value={coercePlatformCurrency(
                  draft.currency ||
                    products.find((p) => p.id === draft.productId)?.currency ||
                    products.find((p) => p.currency)?.currency
                )}
                onChange={(code) => patch({ currency: code })}
                labels={{
                  currency: t.currencyLabel,
                  currencyUsd: t.currencyUsd,
                  currencySyp: t.currencySyp,
                }}
              />
              <Field label={t.quantityLabel}>
                <Input
                  type="number"
                  min="1"
                  dir="ltr"
                  value={draft.quantity}
                  onChange={(e) => patch({ quantity: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t.conditionsLabel}>
              <Textarea
                rows={3}
                value={draft.conditionsNotes}
                onChange={(e) => patch({ conditionsNotes: e.target.value })}
              />
            </Field>
          </fieldset>
        ) : null}

        {draft.step === 2 ? (
          <div className="min-w-0 space-y-4 p-1 sm:p-0">
            <ReviewRow
              label={t.sectionType}
              onEdit={() => patch({ step: 0 })}
              editLabel={t.wizardEdit}
            >
              <p className="break-words">
                {t.dealKind[draft.dealKind] ?? draft.dealKind}
                {" · "}
                {draft.title || "—"}
              </p>
              {draft.dealKind === "catalog" && draft.productId ? (
                <p className="text-sm text-[color:var(--rad-tx3)]">
                  {productName(draft.productId)}
                </p>
              ) : null}
              {draft.message ? (
                <p className="mt-2 break-words text-sm text-[color:var(--rad-tx3)]">
                  {draft.message}
                </p>
              ) : null}
            </ReviewRow>
            <ReviewRow
              label={t.sectionTerms}
              onEdit={() => patch({ step: 1 })}
              editLabel={t.wizardEdit}
            >
              <ul className="space-y-1 text-sm">
                <li>
                  {t.modelNumberLabel}:{" "}
                  <bdi dir="ltr">{draft.modelNumber || "—"}</bdi>
                </li>
                <li>
                  {t.priceOptional}:{" "}
                  {draft.proposedPrice ? (
                    <bdi dir="ltr">
                      {draft.proposedPrice}
                      {draft.currency ? ` ${draft.currency}` : ""}
                    </bdi>
                  ) : (
                    "—"
                  )}
                </li>
                <li>
                  {t.quantityLabel}:{" "}
                  <bdi dir="ltr">{draft.quantity || "—"}</bdi>
                </li>
                {draft.conditionsNotes ? (
                  <li className="break-words">
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
          {traderActionMessage(t, state.error)}
        </Banner>
      ) : null}

      {successId ? (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--ro-ink-950)_45%,transparent)] p-6"
        >
          <div className="rad-card max-w-sm space-y-3 p-6 text-center">
            <p className="text-2xl font-semibold text-[color:var(--rad-tx)]">
              {t.dealSuccessTitle}
            </p>
            <p className="text-sm text-[color:var(--rad-tx3)]">
              {t.dealSuccessBody}
            </p>
            <Button
              type="button"
              onClick={() => {
                setNavigating(true);
                router.push(`/trader/deals/${successId}`);
              }}
            >
              {t.dealSuccessContinue}
            </Button>
          </div>
        </div>
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
    <div className="min-w-0 space-y-2 border-b border-[color:var(--rad-bd)] pb-4 last:border-0 last:pb-0">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold">{label}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-[color:var(--rad-ac)] hover:underline"
        >
          {editLabel}
        </button>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
