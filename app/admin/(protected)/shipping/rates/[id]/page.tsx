import Link from "next/link";
import { notFound } from "next/navigation";
import { RateHistoryPanel } from "@/components/admin/shipping/rate-history-panel";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminShippingRateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale } = await getRequestDictionary();
  const ar = locale === "ar";

  const rate = await prisma.shippingRate.findUnique({
    where: { id },
    include: {
      method: true,
      country: true,
      history: { orderBy: { at: "desc" }, take: 30 },
    },
  });
  if (!rate) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/shipping/rates"
        className="inline-flex min-h-11 items-center text-sm text-[color:var(--rad-ac)] hover:underline"
      >
        {ar ? "← العودة للأسعار" : "← Back to rates"}
      </Link>
      <div className="rounded-lg border border-[color:var(--rad-bd)] p-4 text-sm">
        <div className="text-lg font-semibold">
          <bdi dir="ltr">{rate.countryCode}</bdi>
          {" · "}
          {ar ? rate.method.labelAr : rate.method.labelEn || rate.method.labelAr}
        </div>
        <p className="mt-2 text-[color:var(--rad-tx-2)]">
          {rate.basis} ·{" "}
          <bdi dir="ltr">
            {Number(rate.amount)} {rate.currency}
          </bdi>
          {" · "}
          {rate.verified ? (ar ? "معتمد" : "verified") : (ar ? "غير معتمد" : "unverified")}
          {" · "}
          {rate.active ? (ar ? "نشط" : "active") : (ar ? "معطّل" : "inactive")}
        </p>
      </div>
      <RateHistoryPanel
        locale={locale}
        rateId={rate.id}
        entries={rate.history.map((h) => ({
          id: h.id,
          action: h.action,
          actor: h.actor,
          at: h.at.toISOString(),
          hasBefore: h.before != null,
        }))}
      />
    </div>
  );
}
