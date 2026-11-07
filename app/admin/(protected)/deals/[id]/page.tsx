import { NegotiationThread } from "@/components/deals/negotiation-thread";
import { adminCreateOfferDraftFromDealAction } from "@/app/deal-actions";
import { DealPaymentConfirm } from "@/components/admin/deal-payment-confirm";
import { DetailItem, DetailList } from "@/components/admin/detail-list";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { StatusStepper } from "@/components/ui/status-stepper";
import { getDealForAdmin } from "@/lib/deals/service";
import { isDealStatus, isOpenDealStatus } from "@/lib/deals/constants";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatNumber } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { dealNextActor } from "@/lib/ui/status";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import {
  FilePlus2,
  Handshake,
  Hash,
  MessageSquare,
  Package,
  Store,
  Tags,
} from "lucide-react";
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
  const lastEntry = deal.entries[deal.entries.length - 1];
  const lastActor = (lastEntry?.actorRole ?? null) as
    | "trader"
    | "admin"
    | null;
  const waiting = dealNextActor(deal.status, lastActor) === "admin";
  const linkedConversation = await prisma.whatsAppConversation.findFirst({
    where: { linkType: "deal_proposal", linkId: deal.id },
    select: { id: true, displayName: true, unreadCount: true },
  });
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
      <div className="space-y-4">
        <p className="ro-portal-muted flex items-center gap-2">
          <Handshake className="size-3.5 text-[var(--ro-plum-800)]" aria-hidden />
          {a.deals} · <span dir="ltr">{deal.reference}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="ro-portal-icon-well size-11 [&>svg]:size-5" aria-hidden>
            <Handshake className="size-5" strokeWidth={1.5} />
          </span>
          <h1 className="ro-portal-page-title text-2xl tracking-tight sm:text-[28px]">
            {deal.title}
          </h1>
          <StatusChip {...getStatusChipProps(dict, "deal", deal.status)} />
          {waiting ? (
            <StatusChip size="sm" tone="attention" label={u.waitingOnYou} />
          ) : null}
        </div>
        <p className="text-sm font-semibold">
          <span className="text-ro-muted">{u.colKind}: </span>
          {t.dealKind[deal.dealKind] ?? deal.dealKind}
        </p>
        <StatusStepper domain="deal" current={deal.status} dict={dict} />
        {linkedConversation ? (
          <Link
            href={`/admin/inbox/${linkedConversation.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ro-plum-900)] underline-offset-4 hover:underline"
          >
            <MessageSquare className="size-4" strokeWidth={1.5} aria-hidden />
            {d.linkedConversationOpen}
            {linkedConversation.unreadCount > 0
              ? ` · ${linkedConversation.unreadCount}`
              : ""}
          </Link>
        ) : (
          <p className="text-sm text-ro-muted">{d.linkedConversationNone}</p>
        )}
      </div>

      <DetailList>
        <DetailItem
          label={u.colTrader}
          icon={<Store className="size-3.5" strokeWidth={1.5} />}
        >
          {deal.trader.displayName}
          <span className="text-ro-muted"> · </span>
          <span dir="ltr">{deal.trader.email}</span>
          {deal.trader.companyName ? (
            <div className="text-ro-muted">{deal.trader.companyName}</div>
          ) : null}
        </DetailItem>
        <DetailItem
          label={d.productReference}
          icon={<Package className="size-3.5" strokeWidth={1.5} />}
        >
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
        <DetailItem
          label={locale === "ar" ? "رقم الموديل" : "Model number"}
          icon={<Hash className="size-3.5" strokeWidth={1.5} />}
        >
          <span dir="ltr">
            <bdi dir="ltr">{deal.modelNumber || "—"}</bdi>
          </span>
        </DetailItem>
        <DetailItem
          label={d.commercialSnapshot}
          icon={<Tags className="size-3.5" strokeWidth={1.5} />}
        >
          {deal.proposedPrice != null
            ? money(deal.proposedPrice, deal.currency)
            : "—"}
          {deal.quantity != null ? ` · ${d.qty} ${deal.quantity}` : ""}
        </DetailItem>
        <DetailItem label={d.conditions}>
          <span className="ro-portal-message-panel mt-1 block">
            {deal.conditionsNotes || "—"}
          </span>
        </DetailItem>
      </DetailList>

      {deal.status === "awaiting_payment" ? (
        <DealPaymentConfirm
          dealId={deal.id}
          title={locale === "ar" ? "تأكيد استلام الدفع" : "Confirm payment received"}
          body={
            locale === "ar"
              ? "بعد تحقق التحويل عبر واتساب، أكّد النجاح لإكمال الطلب."
              : "After verifying the WhatsApp transfer, confirm to complete the order."
          }
          confirmLabel={
            locale === "ar" ? "تأكيد نجاح الدفع" : "Confirm payment success"
          }
        />
      ) : null}

      <NegotiationThread
        currency={deal.currency}
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

      <div className="ro-portal-card space-y-3 border p-4 md:p-5">
        <h2 className="ro-portal-section-title flex items-center gap-2 text-lg">
          <span className="ro-portal-icon-well size-8 [&>svg]:size-4" aria-hidden>
            <FilePlus2 className="size-4" strokeWidth={1.5} />
          </span>
          {d.publicOfferTitle}
        </h2>
        <p className="ro-portal-muted">{d.publicOfferBody}</p>
        {deal.curatedOffers.length > 0 ? (
          <ul className="space-y-2 text-sm font-semibold">
            {deal.curatedOffers.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/offers/${o.id}`}
                  className="font-bold text-ro-plum hover:underline"
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
            <FilePlus2 className="size-3.5" strokeWidth={1.5} aria-hidden />
            {d.createDraftOffer}
          </Button>
        </form>
      </div>
    </section>
  );
}
