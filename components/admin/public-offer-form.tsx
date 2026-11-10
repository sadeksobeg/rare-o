"use client";

import {
  adminSetPublicOfferStatusAction,
  adminUpsertPublicOfferAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui-kit/field";
import { Pill, type PillTone } from "@/components/ui-kit/pill";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formErrorClass } from "@/lib/ui/form-classes";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import type { StatusTone } from "@/lib/ui/status";
import { fmt } from "@/lib/ui/trader-labels";
import { useUnsavedGuard } from "@/lib/ui/use-unsaved-guard";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

const initial: ActionResult | null = null;

function offerPillTone(status: string): PillTone {
  const tone: StatusTone =
    status === "published"
      ? "success"
      : status === "unpublished"
        ? "closed"
        : "neutral";
  return statusToneToPill(tone);
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
          <Field label={f.slug}>
            <Input
              name="slug"
              required
              dir="ltr"
              defaultValue={offer?.slug}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={f.titleAr}>
              <Input
                name="titleAr"
                dir="rtl"
                value={titleAr}
                onChange={(e) => {
                  setDirty(true);
                  setTitleAr(e.target.value);
                }}
              />
            </Field>
            <Field label={f.titleEn}>
              <Input
                name="titleEn"
                dir="ltr"
                value={titleEn}
                onChange={(e) => {
                  setDirty(true);
                  setTitleEn(e.target.value);
                }}
              />
            </Field>
          </div>
          <Field label={f.summaryAr}>
            <Textarea
              name="summaryAr"
              rows={4}
              dir="rtl"
              value={summaryAr}
              onChange={(e) => {
                setDirty(true);
                setSummaryAr(e.target.value);
              }}
            />
          </Field>
          <Field label={f.summaryEn}>
            <Textarea
              name="summaryEn"
              rows={4}
              dir="ltr"
              value={summaryEn}
              onChange={(e) => {
                setDirty(true);
                setSummaryEn(e.target.value);
              }}
            />
          </Field>
          <Field label={f.linkedDeal}>
            <Select
              name="dealProposalId"
              defaultValue={offer?.dealProposalId ?? ""}
            >
              <option value="">{f.none}</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.reference} — {d.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={f.linkedProduct}>
            <Select
              name="productId"
              value={productId}
              onChange={(e) => {
                setDirty(true);
                setProductId(e.target.value);
              }}
            >
              <option value="">{f.none}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {productName(p)} ({p.slug})
                </option>
              ))}
            </Select>
          </Field>
          <Field label={f.sortOrder}>
            <Input
              name="sortOrder"
              type="number"
              dir="ltr"
              defaultValue={String(offer?.sortOrder ?? 0)}
            />
          </Field>
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
          <div className="space-y-3 rounded-[14px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface)] p-4">
            <p className="flex w-full flex-wrap items-center gap-2 text-sm text-[color:var(--rad-tx2)]">
              <span>{f.offerCurrentStatus}:</span>
              <Pill tone={offerPillTone(offer.status)}>
                {labels.status.offer[offer.status] ?? offer.status}
              </Pill>
              <span>{f.offerPublishNote}</span>
            </p>
            {statusError ? (
              <p role="alert" className={formErrorClass}>
                {publishErrorLabel(f, statusError)}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {(["published", "unpublished", "draft"] as const).map((status) => {
                const isCurrent = offer.status === status;
                if (isCurrent) {
                  return (
                    <Pill key={status} tone={offerPillTone(status)}>
                      {labels.status.offer[status] ?? status}
                    </Pill>
                  );
                }
                return (
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
                      <label className="mb-2 flex max-w-xs items-start gap-2 text-xs text-[color:var(--rad-tx3)]">
                        <input
                          type="checkbox"
                          name="plateAck"
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium text-[color:var(--rad-tx)]">
                            {f.plateAck}
                          </span>
                          <span className="mt-0.5 block">{f.plateAckHelp}</span>
                        </span>
                      </label>
                    ) : null}
                    <button
                      type="submit"
                      className="rad-btn rad-gh rad-sm"
                      disabled={statusPending}
                    >
                      {fmt(f.setStatusTo, {
                        status: labels.status.offer[status] ?? status,
                      })}
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="sticky top-24 h-fit self-start space-y-3 rounded-[14px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface)] p-4 shadow-[var(--rad-sh)]">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--rad-tx)", fontFamily: "var(--rad-font, inherit)" }}
        >
          {labels.livePreview}
        </h2>
        <div className="overflow-hidden rounded-[12px] border border-[color:var(--rad-bd)] bg-[color:var(--rad-surface)]">
          <div className="flex aspect-[16/9] items-center justify-center bg-[color:var(--rad-surface3)] text-xs text-[color:var(--rad-tx3)]">
            {linked ? productName(linked) : previewTitle}
          </div>
          <div className="space-y-2 bg-[color:var(--rad-surface)] p-3">
            <p className="font-display text-lg font-semibold text-[color:var(--rad-tx)]">
              {previewTitle}
            </p>
            <p className="line-clamp-3 text-sm text-[color:var(--rad-tx2)]">
              {previewSummary}
            </p>
            {offer ? (
              <Pill tone={offerPillTone(offer.status)}>
                {labels.status.offer[offer.status] ?? offer.status}
              </Pill>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
