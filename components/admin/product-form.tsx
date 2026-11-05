"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { upsertProductAction, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/ui/currency-select";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { OudSpecsFields } from "@/components/admin/oud-specs-fields";
import { ProductLivePreview } from "@/components/admin/product-live-preview";
import {
  SuggestEnButton,
  SuggestEnTextAreaPair,
  useSuggestEnglish,
} from "@/components/admin/suggest-en";
import {
  EMPTY_OUD_SPECS_FORM,
  type OudSpecsFormValues,
} from "@/lib/catalog/oud-specs";
import { productSlugCandidate } from "@/lib/catalog/slug";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
  formErrorClass,
} from "@/lib/ui/form-classes";

function fieldScore(value: string, weight = 1) {
  return value.trim().length > 0 ? weight : 0;
}

const initial: ActionResult | null = null;

type CategoryOption = { id: string; nameEn: string; nameAr: string; slug: string };

type ProductValues = {
  id?: string;
  slug?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  specsTextAr?: string;
  specsTextEn?: string;
  categoryId?: string;
  retailPrice?: string;
  compareAtPrice?: string;
  currency?: string;
  status?: string;
  availability?: string;
  wholesaleEligible?: boolean;
  badgeNew?: boolean;
  badgeFeatured?: boolean;
  badgeSale?: boolean;
  oudSpecs?: OudSpecsFormValues;
};

export function ProductForm({
  categories,
  product,
  labels,
  locale,
  showCompareAtPrice = false,
  imageCount = 0,
}: {
  categories: CategoryOption[];
  product?: ProductValues;
  labels: Dictionary["adminUi"];
  locale: Locale;
  /** Gated by RO_PROMO_FEATURES — default hidden. */
  showCompareAtPrice?: boolean;
  /** Images already attached to the product (0 on create). */
  imageCount?: number;
}) {
  const f = labels.form;
  const isEdit = Boolean(product?.id);
  const [state, action, pending] = useActionState(upsertProductAction, initial);
  const [nameAr, setNameAr] = useState(product?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "");
  const [descAr, setDescAr] = useState(product?.descriptionAr ?? "");
  const [descEn, setDescEn] = useState(product?.descriptionEn ?? "");
  const [price, setPrice] = useState(product?.retailPrice ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [dirty, setDirty] = useState(false);
  const [enNameTouched, setEnNameTouched] = useState(
    Boolean(product?.nameEn?.trim())
  );
  const [enDescTouched, setEnDescTouched] = useState(
    Boolean(product?.descriptionEn?.trim())
  );
  const translateLabels = {
    translateSuggest: f.translateSuggest,
    translatePending: f.translatePending,
    translateFailed: f.translateFailed,
  };
  const {
    suggesting,
    error: translateError,
    runSuggest,
    scheduleSuggest,
  } = useSuggestEnglish(translateLabels);

  const previewSlug = isEdit
    ? product?.slug ?? ""
    : productSlugCandidate(nameEn, nameAr) || "product";

  useEffect(() => {
    if (!dirty) return;
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const hasNameAr = nameAr.trim().length > 0;
  const hasImage = imageCount > 0;
  const canPublish = hasNameAr && hasImage;
  const publishBlocked = status === "published" && !canPublish;
  const publishBlockedText = !hasNameAr
    ? f.publishNeedsNameAr
    : !hasImage
      ? f.publishNeedsImage
      : null;

  const arScore =
    fieldScore(nameAr, 2) + fieldScore(descAr, 1) + (hasImage ? 1 : 0);
  const enScore = fieldScore(nameEn, 2) + fieldScore(descEn, 1);
  const arPct = Math.round((arScore / 4) * 100);
  const enPct = Math.round((enScore / 3) * 100);

  const categoryName = (c: CategoryOption) =>
    (locale === "ar" ? c.nameAr || c.nameEn : c.nameEn || c.nameAr) || c.slug;

  const errorText =
    state && !state.ok
      ? state.error === "PUBLISH_NEEDS_NAME_AR"
        ? f.publishNeedsNameAr
        : state.error === "PUBLISH_NEEDS_IMAGE"
          ? f.publishNeedsImage
          : state.error
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
    <form
      action={action}
      className="max-w-2xl space-y-4"
      onChange={() => setDirty(true)}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-ro-muted">
            {labels.completenessAr}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--ro-bg-sunken)]">
            <div
              className="h-full bg-[var(--ro-accent-fg)] transition-[width]"
              style={{ width: `${arPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-ro-muted">
            {labels.completenessEn}
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--ro-bg-sunken)]">
            <div
              className="h-full bg-[var(--ro-progress-700,var(--ro-accent-fg))] transition-[width]"
              style={{ width: `${enPct}%` }}
            />
          </div>
        </div>
      </div>
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="slug" value={isEdit ? product?.slug ?? "" : ""} />
      <div className="space-y-1.5">
        <p className={controlLabelTextClass}>{f.slug}</p>
        <p
          className="rounded-[12px] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-bg-sunken)] px-3 py-2.5 font-mono text-sm text-[color:var(--ro-text-2)]"
          dir="ltr"
        >
          {previewSlug || "—"}
        </p>
        <p className="text-xs text-[color:var(--ro-text-muted)]">
          {isEdit ? f.slugLockedHint : f.slugAutoHint}
        </p>
      </div>
      <p className="text-xs text-[color:var(--ro-text-muted)]">
        {f.translateDraftHint}
      </p>
      {translateError ? (
        <p role="alert" className="text-xs text-[color:var(--ro-danger,#e07070)]">
          {translateError}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          name="nameAr"
          label={f.productNameAr}
          value={nameAr}
          onChange={(e) => {
            const v = e.target.value;
            setNameAr(v);
            scheduleSuggest("name", v, setNameEn, enNameTouched, 900);
          }}
          dir="rtl"
          dense
        />
        <div className="space-y-1.5">
          <TextField
            name="nameEn"
            label={f.productNameEn}
            value={nameEn}
            onChange={(e) => {
              setEnNameTouched(true);
              setNameEn(e.target.value);
            }}
            dir="ltr"
            dense
          />
          <SuggestEnButton
            labels={translateLabels}
            suggesting={suggesting}
            disabled={!nameAr.trim()}
            onClick={() => {
              setEnNameTouched(false);
              runSuggest(
                nameAr,
                (t) => {
                  setNameEn(t);
                  setEnNameTouched(false);
                },
                false
              );
            }}
          />
        </div>
      </div>
      <TextArea
        name="descriptionAr"
        label={f.descriptionAr}
        dir="rtl"
        value={descAr}
        onChange={(v) => {
          setDescAr(v);
          scheduleSuggest("desc", v, setDescEn, enDescTouched, 1100);
        }}
      />
      <div className="space-y-1.5">
        <TextArea
          name="descriptionEn"
          label={f.descriptionEn}
          dir="ltr"
          value={descEn}
          onChange={(v) => {
            setEnDescTouched(true);
            setDescEn(v);
          }}
        />
        <SuggestEnButton
          labels={translateLabels}
          suggesting={suggesting}
          disabled={!descAr.trim()}
          onClick={() => {
            setEnDescTouched(false);
            runSuggest(
              descAr,
              (t) => {
                setDescEn(t);
                setEnDescTouched(false);
              },
              false
            );
          }}
        />
      </div>
      <label className={controlLabelClass}>
        <span className={controlLabelTextClass}>{f.category}</span>
        <select
          name="categoryId"
          required
          defaultValue={product?.categoryId ?? categories[0]?.id}
          className={controlClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryName(c)}
            </option>
          ))}
        </select>
      </label>
      <OudSpecsFields
        labels={f}
        values={product?.oudSpecs ?? EMPTY_OUD_SPECS_FORM}
        translate={translateLabels}
      />
      <SuggestEnTextAreaPair
        arName="specsTextAr"
        enName="specsTextEn"
        arLabel={f.specsAr}
        enLabel={f.specsEn}
        arDefault={product?.specsTextAr ?? ""}
        enDefault={product?.specsTextEn ?? ""}
        arHelper={f.specsHelp}
        labels={translateLabels}
      />
      <div
        className={
          showCompareAtPrice ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"
        }
      >
        <TextField
          name="retailPrice"
          label={f.retailPrice}
          type="number"
          step="0.01"
          dir="ltr"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          dense
        />
        {showCompareAtPrice ? (
          <TextField
            name="compareAtPrice"
            label={f.compareAtPrice}
            helper={f.compareAtHelp}
            type="number"
            step="0.01"
            dir="ltr"
            defaultValue={product?.compareAtPrice ?? ""}
            dense
          />
        ) : product?.compareAtPrice ? (
          <input type="hidden" name="compareAtPrice" value={product.compareAtPrice} />
        ) : null}
      </div>
      <CurrencySelect
        name="currency"
        required
        defaultValue={product?.currency ?? "USD"}
        labels={{
          currency: f.currency,
          currencyUsd: f.currencyUsd,
          currencySyp: f.currencySyp,
          currencyHelp: f.currencyHelp,
        }}
        className="max-w-xs"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>{f.statusLabel}</span>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-describedby="publish-rules-help"
            className={controlClass}
          >
            {(["draft", "published", "archived"] as const).map((s) => (
              <option
                key={s}
                value={s}
                disabled={s === "published" && !canPublish && status !== "published"}
              >
                {labels.productStatus[s] ?? s}
              </option>
            ))}
          </select>
          <span
            id="publish-rules-help"
            className="block text-xs text-ro-muted"
          >
            {publishBlockedText ?? f.publishRulesHint}
          </span>
        </label>
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>
            {f.availabilityLabel}
          </span>
          <select
            name="availability"
            defaultValue={product?.availability ?? "available"}
            aria-describedby="availability-help"
            className={controlClass}
          >
            {(["available", "unavailable"] as const).map((s) => (
              <option key={s} value={s}>
                {labels.availability[s] ?? s}
              </option>
            ))}
          </select>
          <span
            id="availability-help"
            className="block text-xs text-ro-muted"
          >
            {f.availabilityHelp}
          </span>
        </label>
      </div>
      <fieldset className="space-y-3 rounded-[var(--ro-r-sm)] border border-ro-line p-4">
        <legend className={controlLabelTextClass}>{f.storeBadges}</legend>
        <p className="text-xs text-ro-muted">{f.storeBadgesHelp}</p>
        {(
          [
            ["badgeNew", f.badgeNew, product?.badgeNew],
            ["badgeFeatured", f.badgeFeatured, product?.badgeFeatured],
            ["badgeSale", f.badgeSale, product?.badgeSale],
          ] as const
        ).map(([name, label, checked]) => (
          <label key={name} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              defaultChecked={checked}
              className="size-4"
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="wholesaleEligible"
          defaultChecked={product?.wholesaleEligible}
          className="mt-1"
        />
        <span>
          <span className={controlLabelTextClass}>{f.wholesaleEligible}</span>
          <span className="block text-xs text-ro-muted">
            {f.wholesaleEligibleHelp}
          </span>
        </span>
      </label>
      {errorText ? (
        <p role="alert" className={formErrorClass}>
          {errorText}
        </p>
      ) : null}
      {publishBlocked && publishBlockedText ? (
        <p role="alert" className={formErrorClass}>
          {publishBlockedText}
        </p>
      ) : null}
      <div className="z-20 flex flex-wrap items-center gap-3 border-t border-[color:var(--ro-border-subtle)] bg-[color:color-mix(in_srgb,var(--ro-bg-raised)_92%,transparent)] py-3 backdrop-blur md:sticky md:bottom-0">
        <Button type="submit" loading={pending} disabled={publishBlocked}>
          {pending ? f.saving : f.saveProduct}
        </Button>
        {product?.slug && product.status === "published" ? (
          <Link
            href={`/product/${product.slug}`}
            className="text-sm font-medium text-ro-plum hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {f.previewStorefront}
          </Link>
        ) : null}
      </div>
    </form>
    <ProductLivePreview
      className="hidden lg:block"
      title={labels.livePreview}
      nameAr={nameAr}
      nameEn={nameEn}
      priceLabel={price.trim() || "—"}
      statusLabel={labels.productStatus[status] ?? status}
      imageHint={
        hasImage
          ? `${imageCount}`
          : f.publishNeedsImage
      }
    />
    </div>
  );
}

function TextArea(props: {
  name: string;
  label: string;
  dir: "ltr" | "rtl";
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={controlLabelClass}>
      <span className={controlLabelTextClass}>{props.label}</span>
      <textarea
        name={props.name}
        rows={3}
        dir={props.dir}
        value={props.value}
        defaultValue={props.value == null ? props.defaultValue : undefined}
        onChange={
          props.onChange
            ? (e) => props.onChange?.(e.target.value)
            : undefined
        }
        className={controlClass}
      />
    </label>
  );
}
