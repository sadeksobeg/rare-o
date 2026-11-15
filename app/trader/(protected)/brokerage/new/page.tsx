import Link from "next/link";
import { BrokerageNewForm } from "@/components/trader/brokerage-new-form";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderBrokerageNewPage() {
  const { locale, dict } = await getRequestDictionary();
  const t = dict.trader;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link
          href="/trader/brokerage"
          className="text-sm text-[color:var(--rad-ac)] underline-offset-2 hover:underline"
        >
          ← {t.brokerage}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-[color:var(--rad-tx)]">
          {t.brokerageWizardTitle}
        </h1>
      </div>
      <BrokerageNewForm locale={locale} labels={t} />
    </section>
  );
}
