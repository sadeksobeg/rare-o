import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { INVOICE_CSS } from "@/components/invoice/invoice-css";
import { PrintInvoiceButton } from "@/components/storefront/print-button";
import { formatListDate, formatNumber } from "@/lib/i18n/format";
import { siteBaseUrl } from "@/lib/retail-request/order-page";
import { getDealInvoiceByToken } from "@/lib/deals/service";
import { resolveBusinessE164OrNull } from "@/lib/whatsapp/business-number";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "فاتورة صفقة · Deal invoice — RARE OUD",
  robots: { index: false, follow: false, nocache: true },
};

/** DP-2026-ABC123 → INV-DP-2026-ABC123 (shares the deal's unique code). */
function invoiceNumber(reference: string): string {
  return `INV-${reference}`;
}

export default async function DealInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await getDealInvoiceByToken(token);
  if (!d || d.status === "rejected") notFound();

  const currency = d.currency || "USD";
  const n = (v: number) => formatNumber(v, "ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (v: number) => `${n(v)} ${currency}`;
  const unit = d.proposedPrice != null ? Number(d.proposedPrice) : 0;
  const qty = d.quantity && d.quantity > 0 ? d.quantity : 1;
  const total = unit * qty;
  const wa = await resolveBusinessE164OrNull();
  const site = siteBaseUrl().replace(/^https?:\/\//, "");
  const qr = await QRCode.toDataURL(`${siteBaseUrl()}/trader/deals/${d.id}`, {
    margin: 1,
    width: 220,
    color: { dark: "#2a1340", light: "#ffffff" },
  });
  const paid = Boolean(d.paymentConfirmedAt);

  return (
    <div className="inv-wrap" dir="rtl" lang="ar">
      <style dangerouslySetInnerHTML={{ __html: INVOICE_CSS }} />
      <div className="inv-bar">
        <a className="inv-back" href={`/trader/deals/${d.id}`}>
          ← العودة إلى صفقتي
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
            <h1>فاتورة صفقة</h1>
            <div className="inv-meta">
              <div>
                رقم الفاتورة: <bdi dir="ltr">{invoiceNumber(d.reference)}</bdi>
              </div>
              <div>
                التاريخ: <bdi dir="ltr">{formatListDate(d.invoiceIssuedAt ?? d.createdAt)}</bdi>
              </div>
              <div>
                المرجع: <bdi dir="ltr">{d.reference}</bdi>
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
                <b>{d.trader.displayName}</b>
              </p>
              {d.trader.companyName ? <p>{d.trader.companyName}</p> : null}
              {d.trader.phone ? (
                <p dir="ltr" style={{ textAlign: "right" }}>
                  {d.trader.phone}
                </p>
              ) : null}
            </section>
            <section className="inv-card">
              <h3>تفاصيل الصفقة</h3>
              <p>
                <span className="k">الدفع: </span>
                {paid ? "مدفوعة ✓" : "تحويل خارج المنصة بحسب الاتفاق"}
              </p>
              {d.carrier ? (
                <p>
                  <span className="k">الناقل: </span>
                  {d.carrier}
                </p>
              ) : null}
              {d.trackingReference ? (
                <p>
                  <span className="k">رقم التتبع: </span>
                  <bdi dir="ltr">{d.trackingReference}</bdi>
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
              <tr>
                <td>1</td>
                <td>
                  {d.title}
                  {d.modelNumber ? (
                    <>
                      {" "}
                      · <bdi dir="ltr">{d.modelNumber}</bdi>
                    </>
                  ) : null}
                </td>
                <td className="num">{qty}</td>
                <td className="num">
                  <bdi dir="ltr">{money(unit)}</bdi>
                </td>
                <td className="num">
                  <bdi dir="ltr">{money(total)}</bdi>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="inv-totals">
            <div className="grand">
              <span>الإجمالي</span>
              <bdi dir="ltr">{money(total)}</bdi>
            </div>
          </div>

          <div className="inv-notes">
            <div>
              {d.conditionsNotes ? (
                <p>
                  <b>الشروط المتفق عليها:</b> {d.conditionsNotes}
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
              امسح لمتابعة صفقتك
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
