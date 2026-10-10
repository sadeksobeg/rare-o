import Link from "next/link";
import { InboxHealthBanner } from "@/components/admin/inbox-health";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminHomeData } from "@/lib/admin/dashboard";
import { formatCurrency, formatRelative } from "@/lib/i18n/format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getStatusMeta } from "@/lib/ui/status";
import { ButtonLink } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const { locale, dict } = await getRequestDictionary();
  const data = await getAdminHomeData();
  const a = dict.admin;

  const kpis = [
    {
      label: a.kpiRetail,
      value: data.kpis.retailAwaitingAdmin,
      href: "/admin/requests",
    },
    {
      label: a.kpiDeals,
      value: data.kpis.dealsAwaitingAdmin,
      href: "/admin/deals",
    },
    {
      label: a.kpiWholesale,
      value: data.kpis.wholesaleAwaitingAdmin,
      href: "/admin/wholesale",
    },
    {
      label: a.kpiUnread,
      value: data.kpis.unreadConversations,
      href: "/admin/inbox",
    },
  ];

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {a.dashboard}
          </h1>
          <p className="mt-1 text-sm text-ro-muted">
            {a.publishedCount}: {data.published}
          </p>
        </div>
        <ButtonLink href="/admin/products/new" variant="primary" size="sm">
          {a.newProduct}
        </ButtonLink>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.href + kpi.label}
            href={kpi.href}
            className="border border-ro-line bg-ro-surface p-4 transition-colors hover:border-ro-ink/30"
          >
            <p className="text-xs text-ro-muted">{kpi.label}</p>
            {kpi.value === 0 ? (
              <p className="mt-2 text-sm text-[var(--ro-success-700)]">
                {a.kpiIdle}
              </p>
            ) : (
              <p className="mt-2 text-[28px] font-semibold tabular-nums leading-none">
                {kpi.value}
              </p>
            )}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{a.recentRequests}</h2>
            <Link
              href="/admin/requests"
              className="text-sm text-ro-plum hover:underline"
            >
              {a.viewAll}
            </Link>
          </div>
          <ul className="divide-y divide-ro-line border border-ro-line">
            {data.recentRequests.length === 0 ? (
              <li className="p-4 text-sm text-ro-muted">{a.noRequests}</li>
            ) : (
              data.recentRequests.map((r) => {
                const meta = getStatusMeta("retail", r.status);
                return (
                  <li key={r.id}>
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm transition-colors hover:bg-ro-sunken"
                    >
                      <span className="font-medium">{r.reference}</span>
                      <span className="text-ro-muted">{r.customerName}</span>
                      <StatusChip
                        tone={meta.tone}
                        label={r.status}
                        size="sm"
                      />
                      <span className="tabular-nums text-ro-muted">
                        {formatCurrency(
                          Number(r.subtotal),
                          r.currency,
                          locale,
                          dict.product.priceOnRequest
                        )}
                      </span>
                      <span
                        className="text-xs text-ro-muted"
                        title={r.createdAt.toISOString()}
                      >
                        {formatRelative(r.createdAt, locale)}
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="space-y-3 lg:col-span-5">
          <h2 className="text-lg font-semibold">{a.connection}</h2>
          <InboxHealthBanner health={data.health} dict={dict} />
          <div className="flex flex-wrap gap-2 border border-ro-line p-4 text-sm">
            <span className="w-full text-xs text-ro-muted">{a.outbound}</span>
            <ButtonLink href="/admin/products/new" variant="secondary" size="sm">
              {a.quickProduct}
            </ButtonLink>
            <ButtonLink href="/admin/offers" variant="secondary" size="sm">
              {a.quickOffer}
            </ButtonLink>
            <ButtonLink href="/admin/traders" variant="secondary" size="sm">
              {a.quickTrader}
            </ButtonLink>
            <ButtonLink href="/admin/inbox" variant="text" size="sm">
              {a.openInbox}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
