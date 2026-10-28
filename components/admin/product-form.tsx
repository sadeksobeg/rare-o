"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { upsertProductAction, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { OudSpecsFields } from "@/components/admin/oud-specs-fields";
import {
  EMPTY_OUD_SPECS_FORM,
  type OudSpecsFormValues,
} from "@/lib/catalog/oud-specs";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
  formErrorClass,
} from "@/lib/ui/form-classes";

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
  const [state, action, pending] = useActionState(upsertProductAction, initial);
  const [nameAr, setNameAr] = useState(product?.nameAr ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [dirty, setDirty] = useState(false);

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
    <form
      action={action}
      className="max-w-2xl space-y-4"
      onChange={() => setDirty(true)}
    >
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <TextField
        name="slug"
        label={f.slug}
        defaultValue={product?.slug}
        required
        dir="ltr"
        dense
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          name="nameAr"
          label={f.productNameAr}
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          dir="rtl"
          dense
        />
        <TextField
          name="nameEn"
          label={f.productNameEn}
          defaultValue={product?.nameEn}
          dir="ltr"
          dense
        />
      </div>
      <TextArea
        name="descriptionAr"
        label={f.descriptionAr}
        dir="rtl"
        defaultValue={product?.descriptionAr}
      />
      <TextArea
        name="descriptionEn"
        label={f.descriptionEn}
        dir="ltr"
        defaultValue={product?.descriptionEn}
      />
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
      />
      <TextArea
        name="specsTextAr"
        label={f.specsAr}
        dir="rtl"
        defaultValue={product?.specsTextAr}
      />
      {f.specsHelp ? (
        <p className="-mt-2 text-xs text-ro-muted">{f.specsHelp}</p>
      ) : null}
      <TextArea
        name="specsTextEn"
        label={f.specsEn}
        dir="ltr"
        defaultValue={product?.specsTextEn}
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
          defaultValue={product?.retailPrice ?? "0"}
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
      <TextField
        name="currency"
        label={f.currency}
        helper={f.currencyHelp}
        defaultValue={product?.currency ?? ""}
        placeholder={f.currencyPlaceholder}
        dir="ltr"
        required
        dense
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
      <div className="z-20 flex flex-wrap items-center gap-3 border-t border-ro-line bg-ro-surface/95 py-3 backdrop-blur md:sticky md:bottom-0">
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
  );
}

function TextArea(props: {
  name: string;
  label: string;
  dir: "ltr" | "rtl";
  defaultValue?: string;
}) {
  return (
    <label className={controlLabelClass}>
      <span className={controlLabelTextClass}>{props.label}</span>
      <textarea
        name={props.name}
        rows={3}
        dir={props.dir}
        defaultValue={props.defaultValue}
        className={controlClass}
      />
    </label>
  );
}
