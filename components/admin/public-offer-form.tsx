"use client";

import {
  adminSetPublicOfferStatusAction,
  adminUpsertPublicOfferAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { TextField } from "@/components/ui/text-field";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  controlClass,
  controlLabelClass,
  controlLabelTextClass,
  formErrorClass,
} from "@/lib/ui/form-classes";
import { fmt } from "@/lib/ui/trader-labels";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

const initial: ActionResult | null = null;

function offerTone(status: string) {
  return status === "published"
    ? "success"
    : status === "unpublished"
      ? "closed"
      : "neutral";
}

function publishErrorLabel(
  f: Dictionary["adminUi"]["form"],
  code: string
): string {
  switch (code) {
    case "PUBLISH_NEEDS_TITLE_AR":
      return f.publishNeedsTitleAr;
    case "PUBLISH_NEEDS_SUMMARY_AR":
      return f.publishNeedsSummaryAr;
    case "PUBLISH_NEEDS_PRODUCT_OR_PLATE":
      return f.publishNeedsProductOrPlate;
    default:
      return code;
  }
}

export function PublicOfferForm({
  offer,
  deals,
  products,
  labels,
  locale,
}: {
  offer?: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string;
    summaryAr: string;
    summaryEn: string;
    dealProposalId: string | null;
    productId: string | null;
    sortOrder: number;
    status: string;
  };
  deals: Array<{ id: string; reference: string; title: string }>;
  products: Array<{ id: string; slug: string; nameEn: string; nameAr: string }>;
  labels: Dictionary["adminUi"];
  locale: Locale;
}) {
  const f = labels.form;
  const [state, action, pending] = useActionState(
    adminUpsertPublicOfferAction,
    initial
  );
  const router = useRouter();
  const [statusPending, startStatus] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [titleAr, setTitleAr] = useState(offer?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(offer?.titleEn ?? "");
  const [summaryAr, setSummaryAr] = useState(offer?.summaryAr ?? "");
  const [summaryEn, setSummaryEn] = useState(offer?.summaryEn ?? "");
  const [productId, setProductId] = useState(offer?.productId ?? "");
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty);

  const productName = (p: { nameEn: string; nameAr: string }) =>
    (locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr) || "—";

  const previewTitle =
    (locale === "ar" ? titleAr || titleEn : titleEn || titleAr).trim() || "—";
  const previewSummary =
    (locale === "ar" ? summaryAr || summaryEn : summaryEn || summaryAr).trim() ||
    "—";
  const linked = products.find((p) => p.id === productId);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(20rem,100%)]">
      <div className="space-y-6">
        <form
          action={action}
          className="max-w-2xl space-y-4"
          onChange={() => setDirty(true)}
        >
          {offer ? <input type="hidden" name="id" value={offer.id} /> : null}
          <TextField
            name="slug"
            label={f.slug}
            required
            dir="ltr"
            defaultValue={offer?.slug}
            dense
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              name="titleAr"
              label={f.titleAr}
              dir="rtl"
              value={titleAr}
              onChange={(e) => {
                setDirty(true);
                setTitleAr(e.target.value);
              }}
              dense
            />
            <TextField
              name="titleEn"
              label={f.titleEn}
              dir="ltr"
              value={titleEn}
              onChange={(e) => {
                setDirty(true);
                setTitleEn(e.target.value);
              }}
              dense
            />
          </div>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.summaryAr}</span>
            <textarea
              name="summaryAr"
              rows={4}
              dir="rtl"
              value={summaryAr}
              onChange={(e) => {
                setDirty(true);
                setSummaryAr(e.target.value);
              }}
              className={controlClass}
            />
          </label>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.summaryEn}</span>
            <textarea
              name="summaryEn"
              rows={4}
              dir="ltr"
              value={summaryEn}
              onChange={(e) => {
                setDirty(true);
                setSummaryEn(e.target.value);
              }}
              className={controlClass}
            />
          </label>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.linkedDeal}</span>
            <select
              name="dealProposalId"
              defaultValue={offer?.dealProposalId ?? ""}
              className={controlClass}
            >
              <option value="">{f.none}</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.reference} — {d.title}
                </option>
              ))}
            </select>
          </label>
          <label className={controlLabelClass}>
            <span className={controlLabelTextClass}>{f.linkedProduct}</span>
            <select
              name="productId"
              value={productId}
              onChange={(e) => {
                setDirty(true);
                setProductId(e.target.value);
              }}
              className={controlClass}
            >
              <option value="">{f.none}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {productName(p)} ({p.slug})
                </option>
              ))}
            </select>
          </label>
          <TextField
            name="sortOrder"
            label={f.sortOrder}
            type="number"
            dir="ltr"
            defaultValue={String(offer?.sortOrder ?? 0)}
            dense
          />
          {state && !state.ok ? (
            <p role="alert" className={formErrorClass}>
              {state.error}
            </p>
          ) : null}
          <Button type="submit" loading={pending}>
            {offer ? f.saveOffer : f.createDraft}
          </Button>
        </form>

        {offer ? (
          <div className="space-y-3 border border-ro-line p-4">
            <p className="flex w-full flex-wrap items-center gap-2 text-sm text-ro-muted">
              <span>{f.offerCurrentStatus}:</span>
              <StatusChip
                size="sm"
                tone={offerTone(offer.status)}
                label={labels.status.offer[offer.status] ?? offer.status}
              />
              <span>{f.offerPublishNote}</span>
            </p>
            {statusError ? (
              <p role="alert" className={formErrorClass}>
                {publishErrorLabel(f, statusError)}
              </p>
            ) : null}
            <div className="flex flex-wrap items-end gap-3">
              {(["published", "unpublished", "draft"] as const).map((status) => (
                <form
                  key={status}
                  className="space-y-2"
                  action={(fd) => {
                    startStatus(async () => {
                      setStatusError(null);
                      const result = await adminSetPublicOfferStatusAction(fd);
                      if (!result.ok) {
                        setStatusError(result.error);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  <input type="hidden" name="id" value={offer.id} />
                  <input type="hidden" name="status" value={status} />
                  {status === "published" && !offer.productId ? (
                    <label className="flex max-w-xs items-start gap-2 text-xs text-ro-muted">
                      <input
                        type="checkbox"
                        name="plateAck"
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium text-ro-ink">
                          {f.plateAck}
                        </span>
                        <span className="mt-0.5 block">{f.plateAckHelp}</span>
                      </span>
                    </label>
                  ) : null}
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={statusPending || offer.status === status}
                  >
                    {fmt(f.setStatusTo, {
                      status: labels.status.offer[status] ?? status,
                    })}
                  </Button>
                </form>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="sticky top-20 h-fit space-y-3 rounded-[var(--ro-r-lg)] border border-ro-line bg-ro-surface p-4">
        <h2 className="font-display text-sm font-semibold text-ro-ink">
          {labels.livePreview}
        </h2>
        <div className="overflow-hidden rounded-[var(--ro-r-md)] border border-[color-mix(in_srgb,var(--ro-plum-900)_12%,transparent)]">
          <div className="flex aspect-[16/9] items-center justify-center bg-[linear-gradient(160deg,var(--ro-plum-100),var(--ro-sand-200))] text-xs text-ro-muted">
            {linked ? productName(linked) : previewTitle}
          </div>
          <div className="space-y-2 p-3">
            <p className="font-display text-lg font-semibold text-ro-ink">
              {previewTitle}
            </p>
            <p className="line-clamp-3 text-sm text-ro-muted">{previewSummary}</p>
            {offer ? (
              <StatusChip
                size="sm"
                tone={offerTone(offer.status)}
                label={labels.status.offer[offer.status] ?? offer.status}
              />
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
