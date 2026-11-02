"use client";

import { useActionState, useMemo, useState } from "react";
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
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { cn } from "@/lib/utils";

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

function parseLocal(value: string): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
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
  const [titleAr, setTitleAr] = useState(band?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(band?.titleEn ?? "");
  const [bodyAr, setBodyAr] = useState(band?.bodyAr ?? "");
  const [ctaAr, setCtaAr] = useState(band?.ctaLabelAr ?? "");
  const [tone, setTone] = useState(band?.tone ?? "ink");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(band?.startsAt));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(band?.endsAt));
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty);

  const windowPct = useMemo(() => {
    const start = parseLocal(startsAt);
    const end = parseLocal(endsAt);
    const now = Date.now();
    if (start == null || end == null || end <= start) return null;
    const clamped = Math.min(Math.max(now, start), end);
    return ((clamped - start) / (end - start)) * 100;
  }, [startsAt, endsAt]);

  const toneBg =
    tone === "plum"
      ? "bg-[var(--ro-plum-900)] text-[var(--ro-sand-50)]"
      : tone === "sand"
        ? "bg-[var(--ro-sand-200)] text-ro-ink"
        : "bg-[var(--ro-ink-950)] text-[var(--ro-sand-50)]";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(20rem,100%)]">
      <div className="space-y-8">
        <form
          action={action}
          className="max-w-2xl space-y-4"
          onChange={() => setDirty(true)}
        >
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
              value={titleAr}
              onChange={(e) => {
                setDirty(true);
                setTitleAr(e.target.value);
              }}
              dir="rtl"
              dense
            />
            <TextField
              name="titleEn"
              label={f.titleEn}
              value={titleEn}
              onChange={(e) => {
                setDirty(true);
                setTitleEn(e.target.value);
              }}
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
              value={bodyAr}
              onChange={(e) => {
                setDirty(true);
                setBodyAr(e.target.value);
              }}
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
              value={ctaAr}
              onChange={(e) => {
                setDirty(true);
                setCtaAr(e.target.value);
              }}
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
                value={tone}
                onChange={(e) => {
                  setDirty(true);
                  setTone(e.target.value);
                }}
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
              value={startsAt}
              onChange={(e) => {
                setDirty(true);
                setStartsAt(e.target.value);
              }}
              dir="ltr"
              dense
            />
            <TextField
              name="endsAt"
              label={f.endsAt}
              type="datetime-local"
              value={endsAt}
              onChange={(e) => {
                setDirty(true);
                setEndsAt(e.target.value);
              }}
              dir="ltr"
              dense
            />
          </div>
          {windowPct != null ? (
            <div className="space-y-2" aria-hidden>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--ro-sand-200)]">
                <div
                  className="h-full bg-[var(--ro-plum-900)] transition-[width] duration-[var(--ro-dur-base)]"
                  style={{ width: `${windowPct}%` }}
                />
              </div>
              <p className="text-xs text-ro-muted">
                {f.startsAt} → {f.endsAt}
              </p>
            </div>
          ) : null}
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
          <form
            action={deletePromoBandAction}
            className="max-w-2xl border-t border-ro-line pt-6"
          >
            <input type="hidden" name="id" value={band.id} />
            <Button type="submit" variant="danger" size="sm">
              {labels.deletePromo}
            </Button>
          </form>
        ) : null}
      </div>

      <aside className="sticky top-20 h-fit space-y-3 rounded-[var(--ro-r-lg)] border border-ro-line bg-ro-surface p-4">
        <h2 className="font-display text-sm font-semibold text-ro-ink">
          {labels.livePreview}
        </h2>
        <div className={cn("space-y-2 rounded-[var(--ro-r-md)] p-4", toneBg)}>
          <p className="font-display text-lg font-semibold">
            {titleAr.trim() || titleEn.trim() || "—"}
          </p>
          <p className="text-sm opacity-90">{bodyAr.trim() || "—"}</p>
          {ctaAr.trim() ? (
            <span className="inline-flex min-h-11 items-center rounded-[var(--ro-r-sm)] border border-current/30 px-3 text-sm">
              {ctaAr}
            </span>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
