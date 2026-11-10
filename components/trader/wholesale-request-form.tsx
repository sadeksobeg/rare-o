"use client";

import { traderCreateWholesaleRequestAction } from "@/app/wholesale-actions";
import type { ActionResult } from "@/app/actions";
import { BuilderSummaryBar } from "@/components/trader/builder-summary-bar";
import { ShippingCostSelector } from "@/components/storefront/shipping-cost-selector";
import {
  ProductPicker,
  type PickerProduct,
} from "@/components/trader/product-picker";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Field, Input, Select, Textarea } from "@/components/ui-kit/field";
import { Modal } from "@/components/ui-kit/modal";
import { coercePlatformCurrency } from "@/lib/catalog/currency";
import type { Locale } from "@/lib/i18n/config";
import { WHOLESALE_QTY_TECHNICAL_MAX } from "@/lib/wholesale/constants";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { fmt, traderActionMessage, type TraderDict } from "@/lib/ui/trader-labels";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

const initial: ActionResult | null = null;
const DRAFT_KEY = "ro-trader-wholesale-draft";

type Draft = {
  mode: "request_quote" | "propose_price";
  qtyById: Record<string, number>;
  priceById: Record<string, string>;
  currencyById: Record<string, string>;
  notes: string;
};

const emptyDraft = (): Draft => ({
  mode: "request_quote",
  qtyById: {},
  priceById: {},
  currencyById: {},
  notes: "",
});

function isDirty(d: Draft) {
  return Boolean(
    Object.keys(d.qtyById).length > 0 ||
      Object.keys(d.priceById).length > 0 ||
      Object.keys(d.currencyById).length > 0 ||
      d.notes.trim() ||
      d.mode !== "request_quote"
  );
}

export function WholesaleRequestForm({
  products,
  labels: t,
  locale,
}: {
  products: Array<
    PickerProduct & { currency: string; retailPrice?: number }
  >;
  labels: TraderDict;
  locale: Locale;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [state, action, pending] = useActionState(
    traderCreateWholesaleRequestAction,
    initial
  );

  const dirty = isDirty(draft);
  useUnsavedGuard(dirty && !navigating);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Draft>;
        setDraft({
          ...emptyDraft(),
          ...parsed,
          qtyById: parsed.qtyById ?? {},
          priceById: parsed.priceById ?? {},
          currencyById: parsed.currencyById ?? {},
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isDirty(draft)) {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [draft, hydrated]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!a || !isDirty(draft) || navigating) return;
      if (!window.confirm(t.wizardLeaveConfirm)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [draft, navigating, t.wizardLeaveConfirm]);

  useEffect(() => {
    if (!state?.ok || !state.data || typeof state.data !== "object") return;
    const id = (state.data as { id?: string }).id;
    if (!id || navigating || successId) return;
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setReviewOpen(false);
    setSuccessId(id);
  }, [state, navigating, successId]);

  useEffect(() => {
    if (!successId) return;
    const handle = window.setTimeout(() => {
      setNavigating(true);
      router.push(`/trader/wholesale/${successId}`);
    }, 1600);
    return () => window.clearTimeout(handle);
  }, [successId, router]);

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  const selected = useMemo(() => {
    return products
      .filter((p) => (draft.qtyById[p.id] ?? 0) > 0)
      .map((p) => ({
        product: p,
        quantity: draft.qtyById[p.id],
        name:
          locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr,
      }));
  }, [products, draft.qtyById, locale]);

  const selectedLines = useMemo(() => {
    return selected.map(({ product: p, quantity }) => ({
      productId: p.id,
      quantity,
      proposedUnitPrice:
        draft.mode === "propose_price" && draft.priceById[p.id]
          ? Number(draft.priceById[p.id])
          : null,
      currency:
        draft.mode === "propose_price"
          ? coercePlatformCurrency(
              draft.currencyById[p.id] || p.currency || "USD"
            )
          : null,
    }));
  }, [selected, draft.mode, draft.priceById, draft.currencyById]);

  const linesJson = JSON.stringify(selectedLines);
  const countLabel = fmt(t.wsSelectedCount, { n: selected.length });

  return (
    <div className="space-y-6 pb-24">
      <Field label={t.wsModeLabel} className="max-w-md">
        <Select
          value={draft.mode}
          onChange={(e) =>
            patch({
              mode: e.target.value as "request_quote" | "propose_price",
            })
          }
        >
          <option value="request_quote">{t.requestMode.request_quote}</option>
          <option value="propose_price">{t.requestMode.propose_price}</option>
        </Select>
      </Field>
      <p className="max-w-[45rem] text-sm leading-relaxed text-ro-muted">
        {fmt(t.wsFormHint, { max: WHOLESALE_QTY_TECHNICAL_MAX })}
      </p>

      <ProductPicker
        products={products}
        qtyById={draft.qtyById}
        onQtyChange={(id, qty) =>
          setDraft((prev) => {
            const qtyById = { ...prev.qtyById };
            if (qty < 1) {
              delete qtyById[id];
            } else {
              qtyById[id] = qty;
            }
            return { ...prev, qtyById };
          })
        }
        labels={t}
        locale={locale}
      />

      <BuilderSummaryBar
        countLabel={countLabel}
        reviewLabel={t.wsReviewSend}
        onReview={() => setReviewOpen(true)}
        disabled={selected.length === 0}
      />

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={t.wsReviewTitle}
      >
        <form
          action={action}
          className="max-w-full space-y-4 overflow-x-clip"
          onSubmit={() => {
            try {
              sessionStorage.removeItem(DRAFT_KEY);
            } catch {
              /* ignore */
            }
          }}
        >
          <input type="hidden" name="linesJson" value={linesJson} />
          <input type="hidden" name="requestMode" value={draft.mode} />
          <input type="hidden" name="traderNotes" value={draft.notes} />

          <ul className="divide-y divide-[color:var(--rad-bd)] overflow-hidden rounded-[var(--rad-r-sm,10px)] border border-[color:var(--rad-bd)]">
            {selected.map(({ product: p, quantity, name }) => (
              <li key={p.id} className="min-w-0 space-y-2 p-3 text-sm">
                <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                  <span className="min-w-0 break-words font-medium">{name}</span>
                  <span className="shrink-0 text-[color:var(--rad-tx3)]">
                    {t.wsQty}: {quantity}
                  </span>
                </div>
                {draft.mode === "propose_price" ? (
                  <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                    <Field label={t.wsColUnitPrice}>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        dir="ltr"
                        value={draft.priceById[p.id] ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            priceById: {
                              ...prev.priceById,
                              [p.id]: e.target.value,
                            },
                          }))
                        }
                      />
                    </Field>
                    <CurrencySelect
                      name={`currency-${p.id}`}
                      value={coercePlatformCurrency(
                        draft.currencyById[p.id] ?? p.currency
                      )}
                      onChange={(code) =>
                        setDraft((prev) => ({
                          ...prev,
                          currencyById: {
                            ...prev.currencyById,
                            [p.id]: code,
                          },
                        }))
                      }
                      labels={{
                        currency: t.wsColCurrency,
                        currencyUsd: t.currencyUsd,
                        currencySyp: t.currencySyp,
                      }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          <ShippingCostSelector
            locale={locale}
            oudUnitCount={selected.reduce((s, x) => s + x.quantity, 0)}
          />

          <Field label={t.wsNotes}>
            <Textarea
              rows={3}
              value={draft.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </Field>

          {state && !state.ok ? (
            <Banner tone="danger" alert>
              {traderActionMessage(t, state.error)}
            </Banner>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={pending || navigating || selected.length === 0}
            className="w-full"
          >
            {pending || navigating ? t.submitting : t.wsSubmit}
          </Button>
        </form>
      </Modal>

      {successId ? (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--rad-c0,var(--ro-ink-950))_45%,transparent)] p-6"
        >
          <div className="rad-card max-w-sm space-y-3 p-6 text-center">
            <p className="text-2xl font-semibold text-[color:var(--rad-tx)]">
              {t.wholesaleSuccessTitle}
            </p>
            <p className="text-sm text-[color:var(--rad-tx3)]">
              {t.wholesaleSuccessBody}
            </p>
            <Button
              type="button"
              onClick={() => {
                setNavigating(true);
                router.push(`/trader/wholesale/${successId}`);
              }}
            >
              {t.wholesaleSuccessContinue}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
