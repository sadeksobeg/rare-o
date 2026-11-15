import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { INVOICE_CSS } from "@/components/invoice/invoice-css";
import { PrintInvoiceButton } from "@/components/storefront/print-button";
import { formatListDate, formatNumber } from "@/lib/i18n/format";
import { siteBaseUrl } from "@/lib/retail-request/order-page";
import { getWholesaleInvoiceByToken } from "@/lib/wholesale/service";
import { resolveBusinessE164OrNull } from "@/lib/whatsapp/business-number";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "فاتورة جملة · Wholesale invoice — RARE OUD",
  robots: { index: false, follow: false, nocache: true },
};

/** WH-2026-ABC123 → INV-WH-2026-ABC123 (shares the request's unique code). */
function invoiceNumber(reference: string): string {
  return `INV-${reference}`;
}

export default async function WholesaleInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getWholesaleInvoiceByToken(token);
  if (!r || r.status === "cancelled") notFound();

  const currency = r.quoteCurrency || r.lines.find((l) => l.currency)?.currency || "USD";
  const n = (v: number) => formatNumber(v, "ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (v: number, c = currency) => `${n(v)} ${c}`;
  const unit = (l: (typeof r.lines)[number]) =>
    l.quotedUnitPrice != null ? Number(l.quotedUnitPrice) : l.proposedUnitPrice != null ? Number(l.proposedUnitPrice) : 0;
  const subtotal = r.lines.reduce((sum, l) => sum + unit(l) * l.quantity, 0);
  const shipAmount =
    r.shippingCostAmount != null && r.shippingCostCurrency === currency ? Number(r.shippingCostAmount) : null;
  const total = shipAmount != null ? subtotal + shipAmount : subtotal;
  const wa = await resolveBusinessE164OrNull();
  const site = siteBaseUrl().replace(/^https?:\/\//, "");
  const qr = await QRCode.toDataURL(`${siteBaseUrl()}/trader/wholesale/${r.id}`, {
    margin: 1,
    width: 220,
    color: { dark: "#2a1340", light: "#ffffff" },
  });
  const paid = Boolean(r.paymentConfirmedAt);

  return (
    <div className="inv-wrap" dir="rtl" lang="ar">
      <style dangerouslySetInnerHTML={{ __html: INVOICE_CSS }} />
      <div className="inv-bar">
        <a className="inv-back" href={`/trader/wholesale/${r.id}`}>
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
            <h1>فاتورة جملة</h1>
            <div className="inv-meta">
              <div>
                رقم الفاتورة: <bdi dir="ltr">{invoiceNumber(r.reference)}</bdi>
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
              {r.destinationCountry ? (
                <p>
                  <span className="k">الوجهة: </span>
                  {r.destinationCountry}
                </p>
              ) : null}
            </section>
            <section className="inv-card">
              <h3>تفاصيل الطلب</h3>
              <p>
                <span className="k">الدفع: </span>
                {paid ? "مدفوعة" : "تحويل خارج المنصة بحسب الاتفاق"}
              </p>
              {r.shippingMethodLabel ? (
                <p>
                  <span className="k">الشحن: </span>
                  {r.shippingMethodLabel}
                </p>
              ) : null}
              {r.carrier ? (
                <p>
                  <span className="k">الناقل: </span>
                  {r.carrier}
                </p>
              ) : null}
              {r.trackingReference ? (
                <p>
                  <span className="k">رقم التتبع: </span>
                  <bdi dir="ltr">{r.trackingReference}</bdi>
                </p>
              ) : null}
            </section>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>الصنف</th>
                <th className="num">الكمية</th>
                <th className="num">سعر الوحدة</th>
                <th className="num">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {r.lines.map((l, i) => (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td>{l.productNameAr || l.productNameEn}</td>
                  <td className="num">{l.quantity}</td>
                  <td className="num">
                    <bdi dir="ltr">{money(unit(l))}</bdi>
                  </td>
                  <td className="num">
                    <bdi dir="ltr">{money(unit(l) * l.quantity)}</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inv-totals">
            <div>
              <span>المجموع</span>
              <bdi dir="ltr">{money(subtotal)}</bdi>
            </div>
            <div>
              <span>الشحن (تقدير)</span>
              {shipAmount != null ? <bdi dir="ltr">{money(shipAmount)}</bdi> : <span>يُحدَّد لاحقاً</span>}
            </div>
            <div className="grand">
              <span>الإجمالي</span>
              <bdi dir="ltr">{money(total)}</bdi>
            </div>
          </div>

          <div className="inv-notes">
            <div>
              {r.quoteMessage ? (
                <p>
                  <b>ملاحظة الإدارة:</b> {r.quoteMessage}
                </p>
              ) : null}
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
