"use client";

import { useActionState } from "react";
import { upsertProductAction, type ActionResult } from "@/app/actions";

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
}: {
  categories: CategoryOption[];
  product?: ProductValues;
}) {
  const [state, action, pending] = useActionState(upsertProductAction, initial);

  return (
    <form action={action} className="mx-auto max-w-2xl space-y-4">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <Field name="slug" label="Slug" defaultValue={product?.slug} required />
      <Field name="nameAr" label="Name (AR)" defaultValue={product?.nameAr} />
      <Field name="nameEn" label="Name (EN)" defaultValue={product?.nameEn} />
      <TextArea
        name="descriptionAr"
        label="Description (AR)"
        defaultValue={product?.descriptionAr}
      />
      <TextArea
        name="descriptionEn"
        label="Description (EN)"
        defaultValue={product?.descriptionEn}
      />
      <TextArea
        name="specsTextAr"
        label="Specs (AR)"
        defaultValue={product?.specsTextAr}
      />
      <TextArea
        name="specsTextEn"
        label="Specs (EN)"
        defaultValue={product?.specsTextEn}
      />
      <label className="block space-y-1 text-sm">
        <span>Category (launch set only)</span>
        <select
          name="categoryId"
          required
          defaultValue={product?.categoryId ?? categories[0]?.id}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn} / {c.nameAr}
            </option>
          ))}
        </select>
      </label>
      <Field
        name="retailPrice"
        label="Retail price"
        type="number"
        step="0.01"
        defaultValue={product?.retailPrice ?? "0"}
        required
      />
      <Field
        name="currency"
        label="Currency code (configurable — commercial default OPEN)"
        defaultValue={product?.currency ?? ""}
        placeholder="e.g. TEST for fixtures only"
        required
      />
      <label className="block space-y-1 text-sm">
        <span>Status</span>
        <select
          name="status"
          defaultValue={product?.status ?? "draft"}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Availability (retail flag, not inventory)</span>
        <select
          name="availability"
          defaultValue={product?.availability ?? "available"}
          className="w-full border border-ro-line bg-transparent px-3 py-2"
        >
          <option value="available">available</option>
          <option value="unavailable">unavailable</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="wholesaleEligible"
          defaultChecked={product?.wholesaleEligible}
        />
        Wholesale eligible (flag only — no wholesale UI in Week 2)
      </label>
      {state && !state.ok ? (
        <p className="text-sm text-red-800">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory disabled:opacity-60"
      >
        Save product
      </button>
    </form>
  );
}

function Field(props: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{props.label}</span>
      <input
        name={props.name}
        type={props.type ?? "text"}
        step={props.step}
        required={props.required}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        className="w-full border border-ro-line bg-transparent px-3 py-2"
      />
    </label>
  );
}

function TextArea(props: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{props.label}</span>
      <textarea
        name={props.name}
        rows={3}
        defaultValue={props.defaultValue}
        className="w-full border border-ro-line bg-transparent px-3 py-2"
      />
    </label>
  );
}
