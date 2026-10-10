import { requireTraderSession } from "@/lib/auth/trader-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function TraderProfilePage() {
  const session = await requireTraderSession();
  const { dict } = await getRequestDictionary();
  const t = dict.trader;
  const trader = await prisma.traderAccount.findUnique({
    where: { id: session.sub },
  });
  if (!trader) return null;

  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {t.profileTitle}
      </h1>
      <dl className="grid max-w-xl gap-3 text-sm">
        <div>
          <dt className="text-ro-muted">{t.profileName}</dt>
          <dd>{trader.displayName}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">{t.profileEmail}</dt>
          <dd dir="ltr" className="text-start">
            {trader.email}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">{t.profileCompany}</dt>
          <dd>{trader.companyName || "—"}</dd>
        </div>
        <div>
          <dt className="text-ro-muted">{t.profilePhone}</dt>
          <dd dir="ltr" className="text-start">
            {trader.phone || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ro-muted">{t.profileStatus}</dt>
          <dd>{t.accountStatus[trader.status] ?? trader.status}</dd>
        </div>
      </dl>
      <p className="text-sm text-ro-muted">{t.profileNote}</p>
    </section>
  );
}
