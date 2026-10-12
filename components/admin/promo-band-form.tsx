"use client";

import { useActionState } from "react";
import {
  deletePromoBandAction,
  upsertPromoBandAction,
  type ActionResult,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
  formErrorClass,
} from "@/lib/ui/form-classes";

const initial: ActionResult | null = null;

type PromoValues = {
  id?: string;
  slug?: string;
  titleAr?: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
  ctaLabelAr?: string;
  ctaLabelEn?: string;
  href?: string;
  tone?: string;
  imagePath?: string | null;
  sortOrder?: number;
  status?: string;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

function toDatetimeLocal(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PromoBandForm({
  band,
  labels,
}: {
  band?: PromoValues;
  labels: Dictionary["adminUi"];
}) {
  const f = labels.form;
  const [state, action, pending] = useActionState(upsertPromoBandAction, initial);

  return (
    <div className="space-y-8">
      <form action={action} className="max-w-2xl space-y-4">
        {band?.id ? <input type="hidden" name="id" value={band.id} /> : null}
        <TextField
          name="slug"
          label={f.slug}
          defaultValue={band?.slug}
          required
          dir="ltr"
          dense
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            name="titleAr"
            label={f.titleAr}
            defaultValue={band?.titleAr}
            dir="rtl"
            dense
          />
          <TextField
            name="titleEn"
            label={f.titleEn}
            defaultValue={band?.titleEn}
            dir="ltr"
            dense
          />
        </div>
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>{f.bodyAr}</span>
          <textarea
            name="bodyAr"
            rows={3}
            dir="rtl"
            defaultValue={band?.bodyAr}
            className={controlClass}
          />
        </label>
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>{f.bodyEn}</span>
          <textarea
            name="bodyEn"
            rows={3}
            dir="ltr"
            defaultValue={band?.bodyEn}
            className={controlClass}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            name="ctaLabelAr"
            label={f.ctaLabelAr}
            defaultValue={band?.ctaLabelAr}
            dir="rtl"
            dense
          />
          <TextField
            name="ctaLabelEn"
            label={f.ctaLabelEn}
            defaultValue={band?.ctaLabelEn}
            dir="ltr"
            dense
          />
        </div>
        <TextField
          name="href"
          label={f.href}
          helper={f.hrefHelp}
          defaultValue={band?.href ?? "/catalog"}
          required
          dir="ltr"
          dense
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.tone}</span>
            <select
              name="tone"
              defaultValue={band?.tone ?? "ink"}
              className={controlClass}
            >
              {(["ink", "plum", "sand"] as const).map((t) => (
                <option key={t} value={t}>
                  {labels.promoTone[t] ?? t}
                </option>
              ))}
            </select>
          </label>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.statusLabel}</span>
            <select
              name="status"
              defaultValue={band?.status ?? "draft"}
              className={controlClass}
            >
              {(["draft", "published"] as const).map((s) => (
                <option key={s} value={s}>
                  {labels.promoStatus[s] ?? s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextField
          name="imagePath"
          label={f.imagePath}
          defaultValue={band?.imagePath ?? ""}
          dir="ltr"
          dense
        />
        <TextField
          name="sortOrder"
          label={f.sortOrder}
          type="number"
          defaultValue={String(band?.sortOrder ?? 0)}
          dir="ltr"
          dense
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            name="startsAt"
            label={f.startsAt}
            type="datetime-local"
            defaultValue={toDatetimeLocal(band?.startsAt)}
            dir="ltr"
            dense
          />
          <TextField
            name="endsAt"
            label={f.endsAt}
            type="datetime-local"
            defaultValue={toDatetimeLocal(band?.endsAt)}
            dir="ltr"
            dense
          />
        </div>
        {state && !state.ok ? (
          <p role="alert" className={formErrorClass}>
            {state.error}
          </p>
        ) : null}
        <Button type="submit" loading={pending}>
          {pending ? f.saving : f.savePromo}
        </Button>
      </form>

      {band?.id ? (
        <form action={deletePromoBandAction} className="max-w-2xl border-t border-ro-line pt-6">
          <input type="hidden" name="id" value={band.id} />
          <Button type="submit" variant="danger" size="sm">
            {labels.deletePromo}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
