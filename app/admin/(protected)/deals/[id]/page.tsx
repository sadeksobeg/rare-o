import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Circle,
  CircleCheck,
  FilePlus2,
  Handshake,
  MessageSquare,
  Store,
  TriangleAlert,
} from "lucide-react";
import { adminCreateOfferDraftFromDealAction } from "@/app/deal-actions";
import { DealPaymentConfirm } from "@/components/admin/deal-payment-confirm";
import { NegotiationThread } from "@/components/deals/negotiation-thread";
import {
  Avatar,
  Card,
  CardHeader,
  DetailBack,
  DetailGrid,
  DetailHeader,
  DetailStepper,
  KeyValue,
  PayNote,
} from "@/components/ui-kit";
import { findCatalogDealConflicts } from "@/lib/deals/conflict";
import { isDealStatus, isOpenDealStatus } from "@/lib/deals/constants";
import { getDealForAdmin } from "@/lib/deals/service";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatNumber, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { buildDetailSteps } from "@/lib/ui/detail-stepper";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { dealNextActor } from "@/lib/ui/status";
import { getStatusChipProps } from "@/lib/ui/status-labels";

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
  const ar = locale === "ar";

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
    select: {
      id: true,
      displayName: true,
      unreadCount: true,
      lastMessageAt: true,
    },
  });

  const conflicts =
    deal.dealKind === "catalog" && deal.productId
      ? await findCatalogDealConflicts({
          productId: deal.productId,
          excludeDealId: deal.id,
          otherThanTraderId: deal.traderId,
        })
      : [];

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

  const chip = getStatusChipProps(dict, "deal", deal.status);
  const steps = buildDetailSteps("deal", deal.status, dict);
  const meta = [
    `${u.colTrader}: ${deal.trader.displayName}`,
    waiting ? u.waitingOnYou : null,
    `${ar ? "آخر تحديث" : "Updated"} ${formatRelative(deal.updatedAt, locale)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section data-admin-deal-detail="" className="pb-8">
      <DetailBack href="/admin/deals">{a.deals}</DetailBack>

      <DetailHeader
        reference={deal.reference}
        status={chip.label}
        statusTone={statusToneToPill(chip.tone)}
        meta={meta}
        actions={
          <>
            {linkedConversation ? (
              <Link
                href={`/admin/inbox/${linkedConversation.id}`}
                className="rad-btn rad-gh"
              >
                <MessageSquare
                  width={16}
                  height={16}
                  strokeWidth={1.5}
                  aria-hidden
                />
                {d.linkedConversationOpen}
              </Link>
            ) : null}
          </>
        }
      />

      <DetailGrid
        main={
          <>
            <Card className="rad-rise" style={{ ["--rad-s" as string]: "1" }}>
              <DetailStepper steps={steps} aria-label={d.stepperLabel} />
            </Card>

            {deal.status === "awaiting_payment" ? (
              <Card
                padded={false}
                className="rad-rise"
                style={{ ["--rad-s" as string]: "2" }}
              >
                <CardHeader
                  title={ar ? "الدفع خارج المنصة" : "Off-platform payment"}
                />
                <div className="rad-cb2">
                  <DealPaymentConfirm
                    dealId={deal.id}
                    title={
                      ar
                        ? "تأكيد استلام الدفع"
                        : "Confirm payment received"
                    }
                    body={
                      ar
                        ? "بعد تحقق التحويل عبر واتساب، أكّد النجاح لإكمال الطلب. هذا الإجراء يدوي ولا يمكن التراجع عنه."
                        : "After verifying the WhatsApp transfer, confirm to complete the order. This is manual and irreversible."
                    }
                    confirmLabel={
                      ar ? "تأكيد نجاح الدفع" : "Confirm payment success"
                    }
                    cancelLabel={dict.common.cancel}
                    modalTitle={
                      ar
                        ? "تأكيد استلام الدفعة؟"
                        : "Confirm payment received?"
                    }
                    modalBody={
                      ar
                        ? `تأكّد من وصول المبلغ من ${deal.trader.displayName} قبل المتابعة. سيُسجَّل الإجراء باسمك ولا يمكن التراجع عنه.`
                        : `Confirm funds from ${deal.trader.displayName} before continuing. This is audited and irreversible.`
                    }
                  />
                  <KeyValue
                    items={[
                      {
                        label: d.commercialSnapshot,
                        value:
                          deal.proposedPrice != null ? (
                            <bdi dir="ltr">
                              {money(deal.proposedPrice, deal.currency)}
                            </bdi>
                          ) : (
                            "—"
                          ),
                      },
                      {
                        label: d.qty,
                        value: deal.quantity != null ? String(deal.quantity) : "—",
                      },
                    ]}
                  />
                </div>
              </Card>
            ) : deal.status === "payment_confirmed" ? (
              <Card padded={false}>
                <CardHeader
                  title={ar ? "الدفع خارج المنصة" : "Off-platform payment"}
                />
                <div className="rad-cb2">
                  <PayNote ok>
                    <b>
                      {ar
                        ? "تم تأكيد استلام الدفعة."
                        : "Payment receipt confirmed."}
                    </b>
                  </PayNote>
                </div>
              </Card>
            ) : null}

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "3" }}
            >
              <CardHeader title={ar ? "تفاصيل الصفقة" : "Deal details"} />
              <div className="rad-cb2">
                <KeyValue
                  items={[
                    {
                      label: u.colTitle,
                      value: deal.title,
                    },
                    {
                      label: u.colKind,
                      value: t.dealKind[deal.dealKind] ?? deal.dealKind,
                    },
                    {
                      label: d.productReference,
                      value: productName ? (
                        <>
                          {productName}{" "}
                          <span className="rad-mono" style={{ fontSize: 12 }}>
                            {deal.product?.slug}
                          </span>
                        </>
                      ) : (
                        d.nonCatalogNoProduct
                      ),
                    },
                    {
                      label: ar ? "رقم الموديل" : "Model number",
                      value: (
                        <bdi dir="ltr">{deal.modelNumber || "—"}</bdi>
                      ),
                    },
                    {
                      label: d.commercialSnapshot,
                      value: (
                        <>
                          {deal.proposedPrice != null
                            ? money(deal.proposedPrice, deal.currency)
                            : "—"}
                          {deal.quantity != null
                            ? ` · ${d.qty} ${deal.quantity}`
                            : ""}
                        </>
                      ),
                    },
                    {
                      label: d.conditions,
                      value: deal.conditionsNotes || "—",
                      full: true,
                    },
                  ]}
                />
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={u.negotiationThread} />
              <div className="rad-cb2">
                <NegotiationThread
                  bare
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
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={d.publicOfferTitle} />
              <div className="rad-cb2 space-y-3">
                <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                  {d.publicOfferBody}
                </p>
                {deal.curatedOffers.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {deal.curatedOffers.map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/admin/offers/${o.id}`}
                          className="rad-lnk"
                          dir="ltr"
                        >
                          {o.slug}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <form action={adminCreateOfferDraftFromDealAction}>
                  <input type="hidden" name="dealId" value={deal.id} />
                  <button type="submit" className="rad-btn rad-gh rad-sm">
                    <FilePlus2
                      width={14}
                      height={14}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {d.createDraftOffer}
                  </button>
                </form>
              </div>
            </Card>
          </>
        }
        rail={
          <>
            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "2" }}
            >
              <CardHeader title={u.colTrader} />
              <div className="rad-cb2">
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Avatar gradient="g2">
                    {(deal.trader.displayName.trim()[0] || "?").toUpperCase()}
                  </Avatar>
                  <div>
                    <b>{deal.trader.displayName}</b>
                    <div style={{ color: "var(--rad-tx3)", fontSize: 12.5 }}>
                      <bdi dir="ltr">{deal.trader.email}</bdi>
                      {deal.trader.companyName
                        ? ` · ${deal.trader.companyName}`
                        : ""}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/traders/${deal.traderId}`}
                  className="rad-btn rad-gh rad-sm"
                  style={{
                    marginTop: 14,
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Store width={14} height={14} strokeWidth={1.5} aria-hidden />
                  {ar ? "ملف التاجر" : "Trader profile"}
                </Link>
              </div>
            </Card>

            <Card
              padded={false}
              className="rad-rise"
              style={{ ["--rad-s" as string]: "3" }}
            >
              <CardHeader
                title={ar ? "سلامة الصفقة" : "Deal integrity"}
              />
              <div className="rad-cb2">
                <div className="rad-cl2">
                  {conflicts.length === 0 ? (
                    <div className="rad-ok">
                      <CircleCheck
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      {ar
                        ? "لا تعارض مع صفقة تاجر آخر على المنتج"
                        : "No conflicting open deal on this product"}
                    </div>
                  ) : (
                    <div className="rad-err">
                      <TriangleAlert
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      {ar
                        ? `تعارض محتمل (${conflicts.length}) — DEAL_PRODUCT_CONFLICT`
                        : `Possible conflict (${conflicts.length}) — DEAL_PRODUCT_CONFLICT`}
                    </div>
                  )}
                  <div className={deal.product ? "rad-ok" : "rad-no"}>
                    {deal.product ? (
                      <CircleCheck
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    ) : (
                      <Circle
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    )}
                    {deal.product
                      ? ar
                        ? "المنتج مؤهَّل للصفقات"
                        : "Catalog product linked"
                      : ar
                        ? "صفقة خارج الكتالوج"
                        : "Non-catalog deal"}
                  </div>
                  <div
                    className={
                      deal.status === "payment_confirmed" ||
                      deal.status === "completed"
                        ? "rad-ok"
                        : "rad-no"
                    }
                  >
                    {deal.status === "payment_confirmed" ||
                    deal.status === "completed" ? (
                      <CircleCheck
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    ) : (
                      <Circle
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    )}
                    {deal.status === "payment_confirmed" ||
                    deal.status === "completed"
                      ? ar
                        ? "الدفعة مؤكَّدة"
                        : "Payment confirmed"
                      : ar
                        ? "الإيصال لم يُؤكَّد بعد"
                        : "Receipt not confirmed yet"}
                  </div>
                </div>
                {conflicts.length > 0 ? (
                  <ul
                    className="mt-3 space-y-1 text-xs"
                    style={{ color: "var(--rad-tx3)" }}
                  >
                    {conflicts.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/admin/deals/${c.id}`}
                          className="rad-lnk"
                        >
                          {c.reference}
                        </Link>
                        {" · "}
                        {c.traderDisplayName}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Card>

            <Card padded={false}>
              <CardHeader title={d.linkedConversation} />
              <div className="rad-cb2">
                {linkedConversation ? (
                  <div className="rad-rec" style={{ margin: 0 }}>
                    <span className="rad-chip rad-c-ok">
                      <Handshake
                        width={16}
                        height={16}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </span>
                    <div className="rad-tt">
                      <b>
                        {linkedConversation.displayName ||
                          linkedConversation.id}
                      </b>
                      <span>
                        {linkedConversation.lastMessageAt
                          ? formatRelative(
                              linkedConversation.lastMessageAt,
                              locale
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "var(--rad-tx3)", fontSize: 13 }}>
                    {d.linkedConversationNone}
                  </p>
                )}
              </div>
            </Card>
          </>
        }
      />
    </section>
  );
}
