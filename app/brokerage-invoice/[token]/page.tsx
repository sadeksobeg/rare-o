import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { INVOICE_CSS } from "@/components/invoice/invoice-css";
import { PrintInvoiceButton } from "@/components/storefront/print-button";
import { getBrokerageInvoiceByToken } from "@/lib/brokerage/service";
import { formatListDate, formatNumber } from "@/lib/i18n/format";
import { siteBaseUrl } from "@/lib/retail-request/order-page";
import { resolveBusinessE164OrNull } from "@/lib/whatsapp/business-number";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "فاتورة وساطة · Brokerage invoice — RARE OUD",
  robots: { index: false, follow: false, nocache: true },
};

export default async function BrokerageInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getBrokerageInvoiceByToken(token);
  if (!r || ["DECLINED", "REJECTED", "CANCELLED"].includes(r.status)) notFound();

  const n = (v: number) => formatNumber(v, "ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (v: number) => `${n(v)} USD`;
  const qty = Math.max(1, r.quantity);
  const unit = r.quote ? r.quote.goodsValueUsd / qty : r.statedPriceUsd ?? 0;
  const goods = r.quote ? r.quote.goodsValueUsd : unit * qty;
  const commission = r.quote ? goods * (r.quote.commissionRate / 100) : 0;
  const shipping = r.quote ? r.quote.shippingUsd : 0;
  const total = goods + commission + shipping;
  const wa = await resolveBusinessE164OrNull();
  const site = siteBaseUrl().replace(/^https?:\/\//, "");
  const qr = await QRCode.toDataURL(`${siteBaseUrl()}/trader/brokerage/${r.id}`, {
    margin: 1,
    width: 220,
    color: { dark: "#2a1340", light: "#ffffff" },
  });
  const paid = Boolean(r.paymentConfirmedAt);
  const number = `INV-${r.reference}`;

  return (
    <div className="inv-wrap" dir="rtl" lang="ar">
      <style dangerouslySetInnerHTML={{ __html: INVOICE_CSS }} />
      <div className="inv-bar">
        <a className="inv-back" href={`/trader/brokerage/${r.id}`}>
          ← العودة إلى طلبي
        </a>
        <PrintInvoiceButton label="طباعة / حفظ PDF" />
      </div>

      <article className="inv-page">
        <header className="inv-head">
          <div className="inv-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-cream.png" alt="RARE OUD" />
            <div>
              <b>RARE OUD</b>
              <span>عود وخشب نادر بذوق ثقافي معاصر</span>
            </div>
          </div>
          <div className="inv-title">
            <h1>فاتورة وساطة</h1>
            <div className="inv-meta">
              <div>
                رقم الفاتورة: <bdi dir="ltr">{number}</bdi>
              </div>
              <div>
                التاريخ: <bdi dir="ltr">{formatListDate(r.invoiceIssuedAt ?? r.createdAt)}</bdi>
              </div>
              <div>
                المرجع: <bdi dir="ltr">{r.reference}</bdi>
              </div>
            </div>
          </div>
        </header>
        <div className="inv-gold" />

        <div className="inv-body">
          <div className="inv-cols">
            <section className="inv-card">
              <h3>فاتورة إلى</h3>
              <p>
                <b>{r.trader.displayName}</b>
              </p>
              {r.trader.companyName ? <p>{r.trader.companyName}</p> : null}
              {r.trader.phone ? (
                <p dir="ltr" style={{ textAlign: "right" }}>
                  {r.trader.phone}
                </p>
              ) : null}
            </section>
            <section className="inv-card">
              <h3>تفاصيل الطلب</h3>
              <p>
                <span className="k">الدفع: </span>
                {paid ? "مدفوعة ✓" : "تحويل خارج المنصة بحسب الاتفاق"}
              </p>
              {r.carrier ? (
                <p>
                  <span className="k">الناقل: </span>
                  {r.carrier}
                </p>
              ) : null}
              {r.trackingRef ? (
                <p>
                  <span className="k">رقم التتبع: </span>
                  <bdi dir="ltr">{r.trackingRef}</bdi>
                </p>
              ) : null}
            </section>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>القطعة</th>
                <th className="num">الكمية</th>
                <th className="num">سعر الوحدة</th>
                <th className="num">المجموع</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  {r.descriptionAr}
                  {r.modelNumber ? (
                    <>
                      {" "}
                      · <bdi dir="ltr">{r.modelNumber}</bdi>
                    </>
                  ) : null}
                </td>
                <td className="num">{qty}</td>
                <td className="num">
                  <bdi dir="ltr">{money(unit)}</bdi>
                </td>
                <td className="num">
                  <bdi dir="ltr">{money(goods)}</bdi>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="inv-totals">
            {r.quote ? (
              <>
                <div>
                  <span>عمولة الوساطة ({r.quote.commissionRate}%)</span>
                  <bdi dir="ltr">{money(commission)}</bdi>
                </div>
                <div>
                  <span>الشحن</span>
                  <bdi dir="ltr">{money(shipping)}</bdi>
                </div>
              </>
            ) : null}
            <div className="grand">
              <span>الإجمالي</span>
              <bdi dir="ltr">{money(total)}</bdi>
            </div>
          </div>

          <div className="inv-notes">
            <div>
              <p>
                لا يوجد دفع إلكتروني على الموقع. يتم الدفع بالتحويل حسب الاتفاق، ثم تؤكد الإدارة الاستلام وتبدأ بتجهيز الشحن.
              </p>
              <p>شكراً لتعاملك مع RARE OUD.</p>
            </div>
            <div className="inv-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR" />
              امسح لمتابعة طلبك
            </div>
          </div>
        </div>

        <footer className="inv-foot">
          <span>{site}</span>
          {wa ? <span dir="ltr">WhatsApp +{wa}</span> : null}
          <span>RARE OUD</span>
        </footer>
      </article>
    </div>
  );
}
