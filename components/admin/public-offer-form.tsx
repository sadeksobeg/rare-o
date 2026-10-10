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
import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";

const initial: ActionResult | null = null;

function offerTone(status: string) {
  return status === "published"
    ? "success"
    : status === "unpublished"
      ? "closed"
      : "neutral";
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

  const productName = (p: { nameEn: string; nameAr: string }) =>
    (locale === "ar" ? p.nameAr || p.nameEn : p.nameEn || p.nameAr) || "—";

  return (
    <div className="space-y-6">
      <form action={action} className="max-w-2xl space-y-4">
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
            defaultValue={offer?.titleAr}
            dense
          />
          <TextField
            name="titleEn"
            label={f.titleEn}
            dir="ltr"
            defaultValue={offer?.titleEn}
            dense
          />
        </div>
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>{f.summaryAr}</span>
          <textarea
            name="summaryAr"
            rows={4}
            dir="rtl"
            defaultValue={offer?.summaryAr}
            className={controlClass}
          />
        </label>
        <label className={controlLabelClass}>
          <span className={controlLabelTextClass}>{f.summaryEn}</span>
          <textarea
            name="summaryEn"
            rows={4}
            dir="ltr"
            defaultValue={offer?.summaryEn}
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
            defaultValue={offer?.productId ?? ""}
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
        <div className="flex flex-wrap items-center gap-3 border border-ro-line p-4">
          <p className="flex w-full flex-wrap items-center gap-2 text-sm text-ro-muted">
            <span>{f.offerCurrentStatus}:</span>
            <StatusChip
              size="sm"
              tone={offerTone(offer.status)}
              label={labels.status.offer[offer.status] ?? offer.status}
            />
            <span>{f.offerPublishNote}</span>
          </p>
          {(["published", "unpublished", "draft"] as const).map((status) => (
            <form
              key={status}
              action={(fd) => {
                startStatus(async () => {
                  await adminSetPublicOfferStatusAction(fd);
                  router.refresh();
                });
              }}
            >
              <input type="hidden" name="id" value={offer.id} />
              <input type="hidden" name="status" value={status} />
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
      ) : null}
    </div>
  );
}
