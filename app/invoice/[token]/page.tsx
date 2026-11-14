import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintInvoiceButton } from "@/components/storefront/print-button";
import { formatListDate, formatNumber } from "@/lib/i18n/format";
import { getInvoiceByToken } from "@/lib/retail-request/invoice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "فاتورة · Invoice — RARE OUD",
  robots: { index: false, follow: false, nocache: true },
};

const CSS = `
@page { size: A4; margin: 0; }
.inv-wrap { background:#ece7f1; min-height:100vh; padding:24px 12px 48px; font-family: var(--font-sans, "IBM Plex Sans Arabic", system-ui, sans-serif); color:#1d1426; }
.inv-bar { max-width:794px; margin:0 auto 14px; display:flex; justify-content:space-between; align-items:center; gap:12px; }
.inv-print-btn { height:44px; padding:0 22px; border-radius:999px; border:0; background:#2a1340; color:#f4d9a6; font-weight:600; font-size:14px; cursor:pointer; }
.inv-back { color:#2a1340; font-size:14px; text-decoration:underline; text-underline-offset:4px; }
.inv-page { position:relative; width:794px; max-width:100%; min-height:1123px; margin:0 auto; background:#fff; box-shadow:0 30px 80px -30px rgba(42,19,64,.45); overflow:hidden; }
.inv-head { position:relative; background:linear-gradient(135deg,#150b21 0%,#2a1340 55%,#52277c 100%); color:#fff; padding:40px 48px 34px; }
.inv-head::after { content:""; position:absolute; inset-inline-end:-80px; top:-80px; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(200,150,62,.38),transparent 65%); }
.inv-brand { position:relative; display:flex; align-items:center; gap:16px; z-index:1; }
.inv-brand img { height:64px; width:auto; }
.inv-brand b { font-size:26px; letter-spacing:.32em; font-weight:500; }
.inv-brand span { display:block; font-size:12px; opacity:.7; letter-spacing:0; margin-top:4px; }
.inv-title { position:relative; z-index:1; margin-top:26px; display:flex; justify-content:space-between; align-items:flex-end; gap:20px; flex-wrap:wrap; }
.inv-title h1 { margin:0; font-size:34px; font-weight:600; color:#f4d9a6; }
.inv-meta { font-size:13px; line-height:1.9; opacity:.9; text-align:end; }
.inv-meta bdi { font-weight:600; letter-spacing:.04em; }
.inv-gold { height:4px; background:linear-gradient(90deg,#c8963e,#f4d9a6,#c8963e); }
.inv-body { padding:34px 48px 20px; }
.inv-cols { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.inv-card { border:1px solid #e6dff0; border-radius:14px; padding:16px 18px; background:#fcfaff; }
.inv-card h3 { margin:0 0 10px; font-size:12px; letter-spacing:.06em; color:#7a6a91; font-weight:600; }
.inv-card p { margin:3px 0; font-size:14px; line-height:1.7; }
.inv-card .k { color:#7a6a91; }
table.inv-table { width:100%; border-collapse:collapse; margin-top:26px; font-size:14px; }
.inv-table th { background:#2a1340; color:#f4d9a6; font-weight:600; font-size:12.5px; padding:11px 12px; text-align:start; }
.inv-table th:first-child { border-start-start-radius:10px; }
.inv-table th:last-child { border-start-end-radius:10px; }
.inv-table td { padding:13px 12px; border-bottom:1px solid #eee7f5; }
.inv-table td.num, .inv-table th.num { text-align:end; font-variant-numeric:tabular-nums; }
.inv-totals { margin-top:18px; margin-inline-start:auto; width:320px; max-width:100%; }
.inv-totals div { display:flex; justify-content:space-between; padding:7px 4px; font-size:14px; }
.inv-totals .grand { margin-top:6px; padding:14px 16px; border-radius:12px; background:linear-gradient(135deg,#2a1340,#52277c); color:#fff; font-size:17px; font-weight:600; }
.inv-totals .grand bdi { color:#f4d9a6; }
.inv-notes { margin-top:24px; display:grid; grid-template-columns:1fr 150px; gap:22px; align-items:center; }
.inv-notes p { margin:4px 0; font-size:12.5px; line-height:1.8; color:#5d4f72; }
.inv-qr { text-align:center; font-size:11px; color:#7a6a91; }
.inv-qr img { width:130px; height:130px; display:block; margin:0 auto 6px; }
.inv-foot { position:absolute; inset-inline:0; bottom:0; padding:16px 48px 22px; background:#150b21; color:#e8dcc4; display:flex; justify-content:space-between; gap:12px; font-size:12.5px; flex-wrap:wrap; }
.inv-chip { display:inline-block; padding:2px 10px; border-radius:999px; background:rgba(244,217,166,.16); color:#f4d9a6; font-size:12px; margin-inline-start:6px; }
@media (max-width:640px){ .inv-head,.inv-body{padding-inline:20px} .inv-cols{grid-template-columns:1fr} .inv-notes{grid-template-columns:1fr} .inv-foot{padding-inline:20px; position:static; margin-top:24px} .inv-page{min-height:0} .inv-title h1{font-size:26px} }
@media print {
  .inv-wrap { background:#fff; padding:0; }
  .inv-bar { display:none; }
  .inv-page { box-shadow:none; width:210mm; min-height:297mm; margin:0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

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
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
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
