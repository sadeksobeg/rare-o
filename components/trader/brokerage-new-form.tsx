"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import { traderCreateBrokerageAction } from "@/app/brokerage-actions";
import type { ActionResult } from "@/app/actions";
import {
  BrokeragePhotoField,
  type BrokeragePhotoMeta,
} from "@/components/brokerage/photo-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui-kit/field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { cn } from "@/lib/utils";

const initial: ActionResult | null = null;
const DRAFT_KEY = "ro-trader-brokerage-draft";

type Labels = Dictionary["trader"];

type FormFields = {
  descriptionAr: string;
  modelNumber: string;
  statedPriceUsd: string;
  quantity: string;
  cityAr: string;
  placeNameAr: string;
  sellerContact: string;
  sourceUrl: string;
  budgetMinUsd: string;
  budgetMaxUsd: string;
  traderNotes: string;
};

type Draft = {
  step: number;
  form: FormFields;
  photosMeta: BrokeragePhotoMeta[];
};

const emptyForm = (): FormFields => ({
  descriptionAr: "",
  modelNumber: "",
  statedPriceUsd: "",
  quantity: "1",
  cityAr: "",
  placeNameAr: "",
  sellerContact: "",
  sourceUrl: "",
  budgetMinUsd: "",
  budgetMaxUsd: "",
  traderNotes: "",
});

const emptyDraft = (): Draft => ({
  step: 0,
  form: emptyForm(),
  photosMeta: [],
});

function isDirty(d: Draft) {
  const f = d.form;
  return Boolean(
    f.descriptionAr.trim() ||
      f.modelNumber.trim() ||
      f.statedPriceUsd.trim() ||
      (f.quantity.trim() && f.quantity !== "1") ||
      f.cityAr.trim() ||
      f.placeNameAr.trim() ||
      f.sellerContact.trim() ||
      f.sourceUrl.trim() ||
      f.budgetMinUsd.trim() ||
      f.budgetMaxUsd.trim() ||
      f.traderNotes.trim() ||
      d.photosMeta.length > 0 ||
      d.step > 0
  );
}

export function BrokerageNewForm({
  locale,
  labels: t,
}: {
  locale: string;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState(
    traderCreateBrokerageAction,
    initial
  );
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);
  const [photosNeedReattach, setPhotosNeedReattach] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const dirty = isDirty(draft);
  useUnsavedGuard(dirty && !(state?.ok));

  const steps = useMemo(
    () => [
      t.brokerageStepWhat,
      t.brokerageStepWhere,
      t.brokerageStepExpectations,
      t.brokerageStepReview,
    ],
    [t]
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Draft>;
        const hadPhotos =
          Array.isArray(parsed.photosMeta) && parsed.photosMeta.length > 0;
        setDraft({
          ...emptyDraft(),
          step: parsed.step ?? 0,
          form: { ...emptyForm(), ...(parsed.form ?? {}) },
          // File bytes cannot be restored from sessionStorage.
          photosMeta: [],
        });
        if (hadPhotos) setPhotosNeedReattach(true);
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
      if (!a || !isDirty(draft) || state?.ok) return;
      if (!window.confirm(t.wizardLeaveConfirm)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [draft, state?.ok, t.wizardLeaveConfirm]);

  useEffect(() => {
    if (!state?.ok || !state.data || typeof state.data !== "object") return;
    const id = (state.data as { id?: string }).id;
    if (!id || successId) return;
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    setSuccessId(id);
  }, [state, successId]);

  useEffect(() => {
    if (!successId) return;
    const handle = window.setTimeout(() => {
      setNavigating(true);
      router.push(`/trader/brokerage/${successId}`);
    }, 1600);
    return () => window.clearTimeout(handle);
  }, [successId, router]);

  function update<K extends keyof FormFields>(key: K, value: string) {
    setDraft((d) => ({
      ...d,
      form: { ...d.form, [key]: value },
    }));
  }

  function setStep(next: number | ((s: number) => number)) {
    setDraft((d) => ({
      ...d,
      step: typeof next === "function" ? next(d.step) : next,
    }));
  }

  function canNext() {
    if (draft.step === 0) {
      const price = Number(draft.form.statedPriceUsd);
      return (
        draft.form.descriptionAr.trim().length >= 8 &&
        draft.form.modelNumber.trim().length > 0 &&
        Number.isFinite(price) &&
        price > 0
      );
    }
    return true;
  }

  const { step, form } = draft;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-[var(--rad-r,14px)] border border-[color-mix(in_srgb,var(--rad-ac)_28%,transparent)] bg-[color-mix(in_srgb,var(--rad-ac)_12%,var(--rad-surface2))] p-4 text-sm text-[color:var(--rad-tx)]">
        <Info
          className="mt-0.5 size-4 shrink-0 text-[color:var(--rad-ac)]"
          strokeWidth={1.5}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="mb-1 font-semibold">{t.brokerageExplainerTitle}</p>
          <p className="text-[color:var(--rad-tx3)]">{t.brokerageExplainerBody}</p>
        </div>
      </div>

      <div className="flex items-center gap-2" aria-label={t.brokerageWizardTitle}>
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i < step
                  ? "bg-[var(--ro-plum-900)] text-[var(--ro-sand-50)]"
                  : i === step
                    ? "bg-[var(--ro-ink-950)] text-[var(--ro-sand-50)]"
                    : "bg-[var(--ro-sand-200)] text-ro-muted"
              )}
            >
              {i < step ? (
                <Check className="size-4" strokeWidth={2} aria-hidden />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === step ? "font-semibold text-ro-ink" : "text-ro-muted"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 ? (
              <div className="h-px flex-1 bg-ro-line" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>

      <form
        action={action}
        encType="multipart/form-data"
        className="rad-card space-y-4 p-5"
        onSubmit={(e) => {
          if (step < 3) {
            e.preventDefault();
            if (canNext()) setStep((s) => s + 1);
            return;
          }
          try {
            sessionStorage.removeItem(DRAFT_KEY);
          } catch {
            /* ignore */
          }
        }}
      >
        {/* Always present so multipart submit has all fields */}
        <input type="hidden" name="descriptionAr" value={form.descriptionAr} />
        <input type="hidden" name="modelNumber" value={form.modelNumber} />
        <input type="hidden" name="statedPriceUsd" value={form.statedPriceUsd} />
        <input type="hidden" name="quantity" value={form.quantity || "1"} />
        <input type="hidden" name="cityAr" value={form.cityAr} />
        <input type="hidden" name="placeNameAr" value={form.placeNameAr} />
        <input type="hidden" name="sellerContact" value={form.sellerContact} />
        <input type="hidden" name="sourceUrl" value={form.sourceUrl} />
        <input type="hidden" name="budgetMinUsd" value={form.budgetMinUsd} />
        <input type="hidden" name="budgetMaxUsd" value={form.budgetMaxUsd} />
        <input type="hidden" name="traderNotes" value={form.traderNotes} />

        <div className={cn(step !== 0 && "hidden")}>
          <Field label={t.brokerageFieldDescription}>
            <Textarea
              name="descriptionArVisible"
              required
              minLength={8}
              rows={4}
              value={form.descriptionAr}
              onChange={(e) => update("descriptionAr", e.target.value)}
            />
          </Field>
          {/* Keep mounted so file inputs survive later steps */}
          <div className="mt-4">
            <BrokeragePhotoField
              locale={locale}
              onMetaChange={(photosMeta) => {
                setPhotosNeedReattach(false);
                setDraft((d) => ({ ...d, photosMeta }));
              }}
            />
            {photosNeedReattach ? (
              <p className="mt-2 text-xs text-[color:var(--rad-warn,var(--ro-amber-800))]">
                {locale === "ar"
                  ? "كانت هناك صور في المسودة — أعد إرفاقها قبل الإرسال."
                  : "Draft had photos — please re-attach them before sending."}
              </p>
            ) : null}
          </div>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <Field label={t.brokerageFieldCategory}>
              <Input
                name="modelNumberVisible"
                required
                value={form.modelNumber}
                onChange={(e) => update("modelNumber", e.target.value)}
              />
            </Field>
            <Field label={t.brokerageFieldBudgetMin}>
              <Input
                name="statedPriceUsdVisible"
                type="number"
                required
                min={1}
                dir="ltr"
                value={form.statedPriceUsd}
                onChange={(e) => update("statedPriceUsd", e.target.value)}
              />
            </Field>
            <Field label={t.brokerageFieldQuantity}>
              <Input
                name="quantityVisible"
                type="number"
                dir="ltr"
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {step === 1 ? (
          <>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Field label={t.brokerageFieldCity}>
                <Input
                  name="cityArVisible"
                  value={form.cityAr}
                  onChange={(e) => update("cityAr", e.target.value)}
                />
              </Field>
              <Field label={t.brokerageFieldPlace}>
                <Input
                  name="placeNameArVisible"
                  value={form.placeNameAr}
                  onChange={(e) => update("placeNameAr", e.target.value)}
                />
              </Field>
            </div>
            <Field label={t.brokerageFieldSeller}>
              <Input
                name="sellerContactVisible"
                value={form.sellerContact}
                onChange={(e) => update("sellerContact", e.target.value)}
              />
            </Field>
            <Field label={t.brokerageFieldSource}>
              <Input
                name="sourceUrlVisible"
                dir="ltr"
                value={form.sourceUrl}
                onChange={(e) => update("sourceUrl", e.target.value)}
              />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <Field label={t.brokerageFieldBudgetMin}>
                <Input
                  name="budgetMinUsdVisible"
                  type="number"
                  dir="ltr"
                  value={form.budgetMinUsd}
                  onChange={(e) => update("budgetMinUsd", e.target.value)}
                />
              </Field>
              <Field label={t.brokerageFieldBudgetMax}>
                <Input
                  name="budgetMaxUsdVisible"
                  type="number"
                  dir="ltr"
                  value={form.budgetMaxUsd}
                  onChange={(e) => update("budgetMaxUsd", e.target.value)}
                />
              </Field>
            </div>
            <Field label={t.brokerageFieldNotes}>
              <Textarea
                name="traderNotesVisible"
                rows={3}
                value={form.traderNotes}
                onChange={(e) => update("traderNotes", e.target.value)}
              />
            </Field>
          </>
        ) : null}

        {step === 3 ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-ro-muted">{t.brokerageFieldDescription}</dt>
              <dd className="font-medium text-ro-ink">{form.descriptionAr || "—"}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-ro-muted">{t.brokerageFieldCity}</dt>
                <dd>{form.cityAr || "—"}</dd>
              </div>
              <div>
                <dt className="text-ro-muted">{t.brokerageFieldPlace}</dt>
                <dd>{form.placeNameAr || "—"}</dd>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-ro-muted">{t.brokerageFieldBudgetMin}</dt>
                <dd dir="ltr">{form.budgetMinUsd || "—"}</dd>
              </div>
              <div>
                <dt className="text-ro-muted">{t.brokerageFieldBudgetMax}</dt>
                <dd dir="ltr">{form.budgetMaxUsd || "—"}</dd>
              </div>
            </div>
            {draft.photosMeta.length > 0 ? (
              <div>
                <dt className="text-ro-muted">{t.brokeragePiecePhotos}</dt>
                <dd dir="ltr">{draft.photosMeta.map((p) => p.name).join(" · ")}</dd>
              </div>
            ) : null}
            {form.traderNotes ? (
              <div>
                <dt className="text-ro-muted">{t.brokerageFieldNotes}</dt>
                <dd>{form.traderNotes}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {state && !state.ok ? (
          <p className="text-sm text-[var(--ro-danger-700)]">{state.error}</p>
        ) : null}

        <div className="rad-above-tab sticky z-[5] -mx-1 mt-2 flex flex-wrap gap-2 border-t border-[color:var(--rad-bd)] bg-[color:var(--rad-c0)] px-1 pt-3 pb-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {t.wizardBack}
            </Button>
          ) : null}
          {step < 3 ? (
            <Button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="ms-auto"
            >
              {t.wizardNext}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={pending || navigating || !!successId}
              className="ms-auto w-full sm:w-auto"
              size="lg"
            >
              {pending ? t.brokerageSubmitting : t.brokerageSubmit}
            </Button>
          )}
        </div>
      </form>

      {successId ? (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--ro-ink-950)_45%,transparent)] p-6"
        >
          <div className="rad-card max-w-sm space-y-3 p-6 text-center">
            <p className="text-2xl font-semibold text-ro-ink">
              {t.brokerageSuccessTitle}
            </p>
            <p className="text-sm text-ro-muted">{t.brokerageSuccessBody}</p>
            <Button
              type="button"
              onClick={() => {
                setNavigating(true);
                router.push(`/trader/brokerage/${successId}`);
              }}
            >
              {t.brokerageSuccessContinue}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
