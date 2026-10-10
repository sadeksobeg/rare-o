"use client";

import {
  adminSetPublicOfferStatusAction,
  adminUpsertPublicOfferAction,
} from "@/app/deal-actions";
import type { ActionResult } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";

const initial: ActionResult | null = null;

export function PublicOfferForm({
  offer,
  deals,
  products,
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
  products: Array<{ id: string; slug: string; nameEn: string }>;
}) {
  const [state, action, pending] = useActionState(
    adminUpsertPublicOfferAction,
    initial
  );
  const router = useRouter();
  const [statusPending, startStatus] = useTransition();

  return (
    <div className="space-y-6">
      <form action={action} className="mx-auto max-w-2xl space-y-4">
        {offer ? <input type="hidden" name="id" value={offer.id} /> : null}
        <label className="block space-y-1 text-sm">
          <span>Slug</span>
          <input
            name="slug"
            required
            defaultValue={offer?.slug}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>Title (EN)</span>
            <input
              name="titleEn"
              defaultValue={offer?.titleEn}
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Title (AR)</span>
            <input
              name="titleAr"
              defaultValue={offer?.titleAr}
              className="w-full border border-ro-line bg-transparent px-3 py-2"
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span>Summary (EN)</span>
          <textarea
            name="summaryEn"
            rows={4}
            defaultValue={offer?.summaryEn}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Summary (AR)</span>
          <textarea
            name="summaryAr"
            rows={4}
            defaultValue={offer?.summaryAr}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Optional linked deal</span>
          <select
            name="dealProposalId"
            defaultValue={offer?.dealProposalId ?? ""}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          >
            <option value="">None</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.reference} — {d.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Optional catalog product</span>
          <select
            name="productId"
            defaultValue={offer?.productId ?? ""}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          >
            <option value="">None</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameEn} ({p.slug})
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Sort order</span>
          <input
            name="sortOrder"
            type="number"
            defaultValue={offer?.sortOrder ?? 0}
            className="w-full border border-ro-line bg-transparent px-3 py-2"
          />
        </label>
        {state && !state.ok ? (
          <p className="text-sm text-red-800">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="bg-ro-purple px-5 py-3 text-sm text-ro-ivory disabled:opacity-60"
        >
          {offer ? "Save offer" : "Create draft"}
        </button>
      </form>

      {offer ? (
        <div className="flex flex-wrap gap-3 border border-ro-line p-4">
          <p className="w-full text-sm text-ro-muted">
            Current status: <strong>{offer.status}</strong>. Publishing is
            always explicit.
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
              <button
                type="submit"
                disabled={statusPending || offer.status === status}
                className="border border-ro-line px-3 py-2 text-sm disabled:opacity-40"
              >
                Set {status}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
