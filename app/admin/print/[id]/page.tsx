import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireAdminSessionOrRedirect } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { PrintButton } from "@/components/admin/shipping/print-button";
import { formatListDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipping document", robots: { index: false } };

const DOCS = ["waybill", "packing", "invoice"] as const;
type Doc = (typeof DOCS)[number];
const TITLE: Record<Doc, string> = {
  waybill: "بوليصة الشحن · Waybill",
  packing: "قسيمة التعبئة · Packing slip",
  invoice: "فاتورة تجارية · Commercial invoice",
};

export default async function PrintShipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  await requireAdminSessionOrRedirect();
  const { id } = await params;
  const { doc: rawDoc } = await searchParams;
  const doc: Doc = (DOCS as readonly string[]).includes(rawDoc ?? "")
    ? (rawDoc as Doc)
    : "waybill";

  const s = await prisma.shipment.findUnique({
    where: { id },
    include: {
      wholesaleRequest: {
        select: {
          reference: true,
          lines: {
            select: { productNameAr: true, productNameEn: true, quantity: true, quotedUnitPrice: true, currency: true },
          },
        },
      },
      brokerageRequest: { select: { reference: true, descriptionAr: true, modelNumber: true } },
    },
  });
  if (!s) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://rareoud.com";
  const qr = await QRCode.toDataURL(`${base}/track/${s.publicToken}`, { margin: 1, width: 160 });
  const ref = s.wholesaleRequest?.reference ?? s.brokerageRequest?.reference ?? "—";
  const lines = s.wholesaleRequest?.lines ?? [];

  return (
    <main className="print-doc" dir="rtl">
      <style>{`
        @page { size: A4; margin: 14mm; }
        .print-doc{max-width:190mm;margin:0 auto;padding:16px;font:14px/1.5 system-ui,sans-serif;color:#111;background:#fff}
        .print-doc table{width:100%;border-collapse:collapse;margin-top:12px}
        .print-doc th,.print-doc td{border:1px solid #999;padding:6px 8px;text-align:start}
        .print-doc .row{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
        .print-doc .bar{margin-bottom:12px}
        @media print{.print-doc .bar{display:none}}
      `}</style>
      <div className="bar">
        <PrintButton />
      </div>
      <div className="row">
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>RARE OUD</h1>
          <p style={{ margin: 0 }}>{TITLE[doc]}</p>
          <p style={{ margin: "8px 0 0" }}>
            <bdi dir="ltr">{ref}</bdi> · {formatListDate(s.createdAt)}
          </p>
          {s.trackingNumber ? (
            <p style={{ margin: 0 }}>
              Tracking: <bdi dir="ltr">{s.trackingNumber}</bdi>
            </p>
          ) : null}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR" width={96} height={96} />
      </div>

      <table>
        <tbody>
          <tr><th>المستلم · Recipient</th><td>{s.recipientName || "—"}</td></tr>
          <tr><th>الهاتف · Phone</th><td><bdi dir="ltr">{s.recipientPhone || "—"}</bdi></td></tr>
          <tr><th>الوجهة · Destination</th><td>{[s.destCountry, s.destCity, s.destAddress].filter(Boolean).join(" · ") || "—"}</td></tr>
          <tr><th>الناقل · Carrier</th><td>{[s.carrierLabel, s.methodLabel].filter(Boolean).join(" · ") || "—"}</td></tr>
        </tbody>
      </table>

      {doc !== "waybill" ? (
        <table>
          <thead>
            <tr>
              <th>الصنف · Item</th>
              <th>الكمية · Qty</th>
              {doc === "invoice" ? <th>السعر · Unit price</th> : null}
            </tr>
          </thead>
          <tbody>
            {lines.length ? (
              lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.productNameAr} / {l.productNameEn}</td>
                  <td><bdi dir="ltr">{l.quantity}</bdi></td>
                  {doc === "invoice" ? (
                    <td><bdi dir="ltr">{l.quotedUnitPrice != null && l.currency && l.currency !== "TEST" ? `${Number(l.quotedUnitPrice)} ${l.currency}` : "—"}</bdi></td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td>{s.brokerageRequest ? `${s.brokerageRequest.modelNumber} ${s.brokerageRequest.descriptionAr}`.trim() : "—"}</td>
                <td>1</td>
                {doc === "invoice" ? <td>—</td> : null}
              </tr>
            )}
          </tbody>
        </table>
      ) : null}

      {doc === "invoice" ? (
        <p style={{ marginTop: 12 }}>
          <span>الشحن · Shipping</span>{" "}
          <bdi dir="ltr">{Number(s.priceCharged)} {s.currency}</bdi>
          {s.declaredValue != null ? (
            <>
              {" — "}
              <span>القيمة المصرّح بها · Declared value</span>{" "}
              <bdi dir="ltr">{Number(s.declaredValue)} {s.currency}</bdi>
            </>
          ) : null}
        </p>
      ) : null}
    </main>
  );
}
