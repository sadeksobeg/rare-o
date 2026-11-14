import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderPageView } from "@/components/storefront/order-page-view";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getPublicOrder } from "@/lib/retail-request/order-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "طلبي · My request — RARE OUD",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getPublicOrder(token);
  if (!order) notFound();
  const { locale } = await getRequestDictionary();
  return <OrderPageView order={order} token={token} locale={locale} />;
}
