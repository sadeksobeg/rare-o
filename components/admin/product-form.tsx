"use client";

import { useActionState } from "react";
import { upsertProductAction, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
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
  currency?: string;
  status?: string;
  availability?: string;
  wholesaleEligible?: boolean;
};

export function ProductForm({
  categories,
  product,
  labels,
  locale,
}: {
  categories: CategoryOption[];
  product?: ProductValues;
  labels: Dictionary["adminUi"];
  locale: Locale;
}) {
  const f = labels.form;
  const [state, action, pending] = useActionState(upsertProductAction, initial);

  const categoryName = (c: CategoryOption) =>
    (locale === "ar" ? c.nameAr || c.nameEn : c.nameEn || c.nameAr) || c.slug;

  return (
    <form action={action} className="max-w-2xl space-y-4">
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
          defaultValue={product?.nameAr}
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
      <TextArea
        name="specsTextAr"
        label={f.specsAr}
        dir="rtl"
        defaultValue={product?.specsTextAr}
      />
      <TextArea
        name="specsTextEn"
        label={f.specsEn}
        dir="ltr"
        defaultValue={product?.specsTextEn}
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
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>{f.statusLabel}</span>
          <select
            name="status"
            defaultValue={product?.status ?? "draft"}
            className={controlClass}
          >
            {(["draft", "published", "archived"] as const).map((s) => (
              <option key={s} value={s}>
                {labels.productStatus[s] ?? s}
              </option>
            ))}
          </select>
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
      {state && !state.ok ? (
        <p role="alert" className={formErrorClass}>
          {state.error}
        </p>
      ) : null}
      <Button type="submit" loading={pending}>
        {pending ? f.saving : f.saveProduct}
      </Button>
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
