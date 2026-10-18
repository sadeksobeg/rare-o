"use client";

import Link from "next/link";
import { useCart } from "@/components/storefront/cart-provider";
import { ProductThumb } from "@/components/storefront/product-media";
import { QtyStepper } from "@/components/storefront/qty-stepper";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { href } from "@/lib/href";
import type { Locale } from "@/lib/i18n/config";

export type CartViewLabels = {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  catalog: string;
  continue: string;
  remove: string;
  listLabel: string;
  itemsCount: string;
  qtyLabel: string;
  removeAria: string;
  increase: string;
  decrease: string;
  unitPrice: string;
  lineTotal: string;
  summaryTitle: string;
  summaryTotal: string;
  summaryNote: string;
  priceOnRequest: string;
  photoCaption: string;
};

export function CartView({
  locale,
  labels,
  handoff,
}: {
  locale: Locale;
  labels: CartViewLabels;
  /** Server-rendered compact HandoffExplainer. */
  handoff?: React.ReactNode;
}) {
  const { items, hydrated, removeItem, setQuantity } = useCart();

  if (!hydrated) {
    return (
      <div
        className="mx-auto max-w-[1440px] px-5 py-24 md:px-8"
        aria-busy="true"
        aria-label={labels.title}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={labels.emptyTitle}
        body={labels.emptyBody}
        actionHref={href("/catalog", locale)}
        actionLabel={labels.catalog}
        className="py-24"
      />
    );
  }

  const fmt = (n: number) => n.toLocaleString(locale);
  const pieces = items.reduce((n, i) => n + i.quantity, 0);
  const currencies = new Set(items.map((i) => i.currency));
  const singleCurrency = currencies.size === 1 ? items[0].currency : null;
  const priced = items.every((i) => Number.isFinite(i.price) && i.price > 0);
  const total =
    singleCurrency && priced
      ? items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      : null;
  const piecesText = labels.itemsCount.replace("{n}", fmt(pieces));

  const summary = (
    <>
      <h2 className="text-sm font-semibold text-ro-ink">
        {labels.summaryTitle}
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm text-ro-text-2">
        {items.map((item) => (
          <li
            key={`sum-${item.productId}`}
            className="flex items-baseline justify-between gap-3"
          >
            <span className="min-w-0 truncate">{item.name}</span>
            <span className="shrink-0 tabular-nums text-ro-muted">
              × {fmt(item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-ro-border pt-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ro-muted">{piecesText}</dt>
          <dd className="tabular-nums text-ro-ink">
            {total !== null ? (
              <bdi className="text-base font-semibold">
                {fmt(total)} {singleCurrency}
              </bdi>
            ) : (
              <span className="text-ro-muted">{labels.priceOnRequest}</span>
            )}
          </dd>
        </div>
        {total !== null ? (
          <div className="text-xs text-ro-muted">{labels.summaryTotal}</div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-ro-muted">
        {labels.summaryNote}
      </p>
    </>
  );

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="ro-type-h1">{labels.title}</h1>
        <p className="text-sm text-ro-muted" aria-live="polite">
          {piecesText}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12">
        <ul
          aria-label={labels.listLabel}
          className="divide-y divide-ro-border border-y border-ro-border"
        >
          {items.map((item) => {
            const lineTotal = item.price * item.quantity;
            const hasPrice = Number.isFinite(item.price) && item.price > 0;
            return (
              <li key={item.productId} className="flex gap-4 py-5 md:gap-6">
                <Link
                  href={href(`/product/${item.slug}`, locale)}
                  className="block w-20 shrink-0 md:w-24"
                  tabIndex={-1}
                  aria-hidden
                >
                  <ProductThumb
                    path={item.imagePath}
                    alt=""
                    plateCaption={labels.photoCaption}
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium leading-snug">
                        <Link
                          href={href(`/product/${item.slug}`, locale)}
                          className="hover:text-ro-plum"
                        >
                          {item.name}
                        </Link>
                      </p>
                      <p className="text-sm text-ro-muted tabular-nums">
                        {hasPrice ? (
                          <>
                            <span className="sr-only">{labels.unitPrice}: </span>
                            <bdi>
                              {fmt(item.price)} {item.currency}
                            </bdi>
                          </>
                        ) : (
                          labels.priceOnRequest
                        )}
                      </p>
                    </div>
                    {hasPrice ? (
                      <p
                        className="shrink-0 text-end font-semibold tabular-nums"
                        title={labels.lineTotal}
                      >
                        <span className="sr-only">{labels.lineTotal}: </span>
                        <bdi>
                          {fmt(lineTotal)} {item.currency}
                        </bdi>
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <QtyStepper
                      value={item.quantity}
                      onChange={(q) => setQuantity(item.productId, q)}
                      label={labels.qtyLabel.replace("{name}", item.name)}
                      increaseLabel={labels.increase}
                      decreaseLabel={labels.decrease}
                    />
                    <button
                      type="button"
                      className="min-h-11 px-1 text-sm text-ro-muted underline-offset-4 hover:text-ro-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
                      aria-label={labels.removeAria.replace("{name}", item.name)}
                      onClick={() => removeItem(item.productId)}
                    >
                      {labels.remove}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="hidden rounded-[var(--ro-r-sm)] border border-ro-border bg-ro-paper p-5 lg:block">
            {summary}
            <ButtonLink
              href={href("/request", locale)}
              size="lg"
              className="mt-5 w-full"
            >
              {labels.continue}
            </ButtonLink>
          </div>
          {handoff}
        </aside>
      </div>

      {/* Mobile / tablet sticky summary bar */}
      <div className="sticky bottom-0 z-30 -mx-4 border-t border-ro-border bg-ro-cream/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-ro-muted">{piecesText}</p>
            {total !== null ? (
              <p className="font-semibold tabular-nums">
                <bdi>
                  {fmt(total)} {singleCurrency}
                </bdi>
              </p>
            ) : null}
          </div>
          <ButtonLink
            href={href("/request", locale)}
            size="lg"
            className="shrink-0"
          >
            {labels.continue}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
