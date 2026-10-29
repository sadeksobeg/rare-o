import Link from "next/link";
import { BrokerageNewForm } from "@/components/trader/brokerage-new-form";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderBrokerageNewPage() {
  const { locale } = await getRequestDictionary();
  const ar = locale === "ar";

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/trader/brokerage"
          className="text-sm text-[var(--ro-plum-900)] underline-offset-2 hover:underline"
        >
          {ar ? "← طلباتي" : "← My requests"}
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ro-ink">
          {ar ? "طلب وساطة جديد" : "New brokerage request"}
        </h1>
        <p className="mt-1 text-sm text-[var(--ro-ink-600)]">
          {ar
            ? "عمولة 1–2% من قيمة البضاعة. لا شراء قبل موافقتك على العرض."
            : "Commission 1–2% of goods value. No purchase before you approve the quote."}
        </p>
      </div>
      <BrokerageNewForm locale={locale} />
    </section>
  );
}
