import { NegotiationThread } from "@/components/deals/negotiation-thread";
import { adminCreateOfferDraftFromDealAction } from "@/app/deal-actions";
import { DetailItem, DetailList } from "@/components/admin/detail-list";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { StatusStepper } from "@/components/ui/status-stepper";
import { getDealForAdmin } from "@/lib/deals/service";
import { isDealStatus, isOpenDealStatus } from "@/lib/deals/constants";
import { formatCurrency, formatNumber } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const d = u.detail;
  const t = dict.trader;

  let deal;
  try {
    deal = await getDealForAdmin(id);
  } catch {
    notFound();
  }

  const open = isDealStatus(deal.status) && isOpenDealStatus(deal.status);
  const money = (value: unknown, currency: string | null | undefined) =>
    currency
      ? formatCurrency(
          Number(value),
          currency,
          locale,
          dict.product.priceOnRequest
        )
      : formatNumber(Number(value), locale, { maximumFractionDigits: 2 });
  const productName = deal.product
    ? (locale === "ar"
        ? deal.product.nameAr || deal.product.nameEn
        : deal.product.nameEn || deal.product.nameAr) || deal.product.slug
    : null;

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-ro-muted">
          {a.deals} · <span dir="ltr">{deal.reference}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {deal.title}
          </h1>
          <StatusChip {...getStatusChipProps(dict, "deal", deal.status)} />
        </div>
        <p className="text-sm">
          <span className="text-ro-muted">{u.colKind}: </span>
          {t.dealKind[deal.dealKind] ?? deal.dealKind}
        </p>
        <StatusStepper domain="deal" current={deal.status} dict={dict} />
      </div>

      <DetailList>
        <DetailItem label={u.colTrader}>
          {deal.trader.displayName}
          <span className="text-ro-muted"> · </span>
          <span dir="ltr">{deal.trader.email}</span>
          {deal.trader.companyName ? (
            <div className="text-ro-muted">{deal.trader.companyName}</div>
          ) : null}
        </DetailItem>
        <DetailItem label={d.productReference}>
          {deal.product && productName ? (
            <>
              {productName}{" "}
              <span className="text-ro-muted" dir="ltr">
                ({deal.product.slug})
              </span>
            </>
          ) : (
            d.nonCatalogNoProduct
          )}
        </DetailItem>
        <DetailItem label={d.commercialSnapshot}>
          {deal.proposedPrice != null
            ? money(deal.proposedPrice, deal.currency)
            : "—"}
          {deal.quantity != null ? ` · ${d.qty} ${deal.quantity}` : ""}
        </DetailItem>
        <DetailItem label={d.conditions}>
          <span className="whitespace-pre-wrap">
            {deal.conditionsNotes || "—"}
          </span>
        </DetailItem>
      </DetailList>

      <NegotiationThread
        entries={deal.entries}
        dealId={deal.id}
        mode="admin"
        open={open}
        locale={locale}
        labels={t}
        title={u.negotiationThread}
        money={money}
        termsLabel={d.terms}
        qtyLabel={d.qty}
      />

      <div className="space-y-3 border border-ro-line p-4">
        <h2 className="text-lg font-semibold">{d.publicOfferTitle}</h2>
        <p className="text-sm text-ro-muted">{d.publicOfferBody}</p>
        {deal.curatedOffers.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {deal.curatedOffers.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/offers/${o.id}`}
                  className="text-ro-plum hover:underline"
                  dir="ltr"
                >
                  {o.slug}
                </Link>
                <StatusChip
                  size="sm"
                  {...getStatusChipProps(dict, "offer", o.status)}
                />
              </li>
            ))}
          </ul>
        ) : null}
        <form action={adminCreateOfferDraftFromDealAction}>
          <input type="hidden" name="dealId" value={deal.id} />
          <Button type="submit" variant="secondary" size="sm">
            {d.createDraftOffer}
          </Button>
        </form>
      </div>
    </section>
  );
}
