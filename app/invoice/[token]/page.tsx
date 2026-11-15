import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { INVOICE_CSS } from "@/components/invoice/invoice-css";
import { PrintInvoiceButton } from "@/components/storefront/print-button";
import { formatListDate, formatNumber } from "@/lib/i18n/format";
import { getInvoiceByToken } from "@/lib/retail-request/invoice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "فاتورة · Invoice — RARE OUD",
  robots: { index: false, follow: false, nocache: true },
};


export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getInvoiceByToken(token);
  if (!inv) notFound();
  const ar = inv.locale === "ar";
  const n = (v: number) => formatNumber(v, inv.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (v: number, c = inv.currency) => `${n(v)} ${c}`;
  const L = (a: string, e: string) => (ar ? a : e);

  return (
    <div className="inv-wrap" dir={ar ? "rtl" : "ltr"} lang={inv.locale}>
      <style dangerouslySetInnerHTML={{ __html: INVOICE_CSS }} />
      <div className="inv-bar">
        <a className="inv-back" href={`/order/${token}`}>
          {L("← العودة إلى طلبي", "← Back to my request")}
        </a>
        <PrintInvoiceButton label={L("طباعة / حفظ PDF", "Print / Save PDF")} />
      </div>

      <article className="inv-page">
        <header className="inv-head">
          <div className="inv-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-cream.png" alt="RARE OUD" />
            <div>
              <b>RARE OUD</b>
              <span>{L("عود وخشب نادر بذوق ثقافي معاصر", "Rare oud and wood, a contemporary cultural taste")}</span>
            </div>
          </div>
          <div className="inv-title">
            <h1>{L("فاتورة", "Invoice")}</h1>
            <div className="inv-meta">
              <div>
                {L("رقم الفاتورة", "Invoice no.")}: <bdi dir="ltr">{inv.number}</bdi>
              </div>
              <div>
                {L("التاريخ", "Date")}: <bdi dir="ltr">{formatListDate(inv.issuedAt)}</bdi>
              </div>
              <div>
                {L("المرجع", "Reference")}: <bdi dir="ltr">{inv.reference}</bdi>
              </div>
            </div>
          </div>
        </header>
        <div className="inv-gold" />

        <div className="inv-body">
          <div className="inv-cols">
            <section className="inv-card">
              <h3>{L("فاتورة إلى", "Billed to")}</h3>
              <p>
                <b>{inv.customer.name}</b>
              </p>
              <p dir="ltr" style={{ textAlign: ar ? "right" : "left" }}>
                {inv.customer.phone}
              </p>
              <p>
                <span className="k">{L("الوجهة", "Destination")}: </span>
                {inv.customer.destination}
              </p>
            </section>
            <section className="inv-card">
              <h3>{L("تفاصيل الطلب", "Order details")}</h3>
              {inv.payment ? (
                <p>
                  <span className="k">{L("الدفع", "Payment")}: </span>
                  {inv.payment}
                </p>
              ) : null}
              {inv.shipping?.label ? (
                <p>
                  <span className="k">{L("الشحن", "Shipping")}: </span>
                  {inv.shipping.label}
                </p>
              ) : null}
              {inv.etaLabel ? (
                <p>
                  <span className="k">{L("الوصول المتوقع", "Expected delivery")}: </span>
                  {inv.etaLabel}
                </p>
              ) : null}
              {inv.tracking ? (
                <p>
                  <span className="k">{L("رقم التتبع", "Tracking")}: </span>
                  <bdi dir="ltr">{inv.tracking}</bdi>
                </p>
              ) : null}
            </section>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>{L("الصنف", "Item")}</th>
                <th className="num">{L("الكمية", "Qty")}</th>
                <th className="num">{L("سعر الوحدة", "Unit price")}</th>
                <th className="num">{L("المجموع", "Total")}</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{l.name}</td>
                  <td className="num">{l.quantity}</td>
                  <td className="num">
                    <bdi dir="ltr">{money(l.unit)}</bdi>
                  </td>
                  <td className="num">
                    <bdi dir="ltr">{money(l.total)}</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inv-totals">
            <div>
              <span>{L("المجموع", "Subtotal")}</span>
              <bdi dir="ltr">{money(inv.subtotal)}</bdi>
            </div>
            <div>
              <span>{L("الشحن (تقدير)", "Shipping (estimate)")}</span>
              {inv.shipping ? <bdi dir="ltr">{money(inv.shipping.amount, inv.shipping.currency)}</bdi> : <span>{L("يُحدَّد بعد التأكيد", "to be confirmed")}</span>}
            </div>
            {inv.total != null ? (
              <div className="grand">
                <span>{L("الإجمالي", "Total")}</span>
                <bdi dir="ltr">{money(inv.total)}</bdi>
              </div>
            ) : null}
          </div>

          <div className="inv-notes">
            <div>
              {inv.notes ? (
                <p>
                  <b>{L("ملاحظاتك", "Your notes")}:</b> {inv.notes}
                </p>
              ) : null}
              <p>
                {L(
                  "الأسعار والشحن تقديرية ما لم يُؤكَّد خلاف ذلك من فريقنا، ولا يوجد دفع إلكتروني على الموقع. يتم الدفع بحسب الطريقة المتفق عليها.",
                  "Prices and shipping are estimates unless confirmed otherwise by our team; there is no online payment on the site. Payment follows the method agreed with you."
                )}
              </p>
              <p>{L("شكراً لثقتك بـ RARE OUD — نتمنى أن تسعدك قطعتك.", "Thank you for choosing RARE OUD — we hope you love your piece.")}</p>
            </div>
            <div className="inv-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={inv.qr} alt="QR" />
              {L("امسح لمتابعة طلبك", "Scan to follow your order")}
            </div>
          </div>
        </div>

        <footer className="inv-foot">
          <span>{inv.site}</span>
          {inv.whatsapp ? (
            <span dir="ltr">
              WhatsApp {inv.whatsapp}
            </span>
          ) : null}
          <span>RARE OUD</span>
        </footer>
      </article>
    </div>
  );
}
