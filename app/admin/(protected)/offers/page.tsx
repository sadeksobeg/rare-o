import { Suspense } from "react";
import { Percent, Plus } from "lucide-react";
import {
  DataTable,
  DataTableHead,
  RowHit,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import {
  AdminRecordCard,
  AdminRecordCardList,
} from "@/components/admin/list-record-card";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { AdminTableFilters } from "@/components/admin/table-filters";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { PUBLIC_OFFER_STATUSES } from "@/lib/deals/constants";
import { getRequestDictionary } from "@/lib/i18n/server";
import { isFresh } from "@/lib/ui/fresh";
import { getStatusChipProps } from "@/lib/ui/status-labels";
import { listPublicOffersForAdmin } from "@/lib/offers/service";

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab: tabRaw, q: qRaw } = await searchParams;
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const a = dict.admin;
  const u = dict.adminUi;
  const offers = await listPublicOffersForAdmin();
  const q = qRaw?.trim().toLowerCase() ?? "";
  const tab = tabRaw?.trim() || "all";

  const counts: Record<string, number> = { all: offers.length };
  for (const s of PUBLIC_OFFER_STATUSES) {
    counts[s] = offers.filter((o) => o.status === s).length;
  }

  const filtered = offers.filter((o) => {
    if (tab !== "all" && o.status !== tab) return false;
    if (!q) return true;
    const titleAr = o.titleAr || "";
    const titleEn = o.titleEn || "";
    const hay = [o.slug, titleAr, titleEn, o.dealProposal?.reference ?? ""]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const filteredEmpty = tab !== "all" || Boolean(q);

  return (
    <section data-admin-offers="" className="space-y-5 pb-16">
      <PortalHeroStrip
        eyebrow={ar ? "كتالوج" : "Catalog"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Percent
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {a.offers}
          </span>
        }
        subtitle={u.offersLead}
        actions={
          <ButtonLink href="/admin/offers/new" variant="primary" size="sm">
            <Plus className="size-3.5" strokeWidth={1.5} aria-hidden />
            {u.newOffer}
          </ButtonLink>
        }
        stats={[
          {
            label: ar ? "الكل" : "Total",
            value: counts.all,
          },
          {
            label: u.status.offer.published,
            value: counts.published ?? 0,
            hint: ar ? "على المتجر" : "On storefront",
          },
          {
            label: u.status.offer.draft,
            value: counts.draft ?? 0,
          },
          {
            label: u.status.offer.unpublished,
            value: counts.unpublished ?? 0,
          },
        ]}
      />

      <Suspense fallback={null}>
        <AdminTableFilters
          tabsLabel={u.filterTabs}
          searchLabel={u.search}
          searchPlaceholder={ar ? "ابحث بالعنوان أو المرجع…" : "Search title or ref…"}
          resultCount={filtered.length}
          resultLabel={u.resultsLabel}
          tabs={[
            { id: "all", label: u.filterAll, count: counts.all },
            ...PUBLIC_OFFER_STATUSES.map((s) => ({
              id: s,
              label: u.status.offer[s] ?? s,
              count: counts[s] ?? 0,
            })),
          ]}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <EmptyState
          variant={filteredEmpty ? "no-results" : "first-use"}
          title={u.emptyTitle}
          body={u.emptyBody}
          actionHref={filteredEmpty ? "/admin/offers" : "/admin/offers/new"}
          actionLabel={filteredEmpty ? dict.catalog.clearFilters : u.newOffer}
        />
      ) : (
        <>
          <AdminRecordCardList>
            {filtered.map((o) => {
              const title =
                locale === "ar"
                  ? o.titleAr || o.titleEn
                  : o.titleEn || o.titleAr;
              return (
                <AdminRecordCard
                  key={o.id}
                  href={`/admin/offers/${o.id}`}
                  flash={isFresh(o.updatedAt)}
                  title={title}
                  meta={o.slug}
                  trailing={
                    <StatusChip
                      size="sm"
                      {...getStatusChipProps(dict, "offer", o.status)}
                    />
                  }
                  actionLabel={a.edit}
                />
              );
            })}
          </AdminRecordCardList>
          <div className="hidden md:block">
            <DataTable>
              <DataTableHead>
                <Th>{u.colTitle}</Th>
                <Th>{a.colSlug}</Th>
                <Th>{a.colStatus}</Th>
                <Th>{u.colDeal}</Th>
              </DataTableHead>
              <tbody>
                {filtered.map((o) => {
                  const title =
                    locale === "ar"
                      ? o.titleAr || o.titleEn
                      : o.titleEn || o.titleAr;
                  return (
                    <Tr
                      key={o.id}
                      href={`/admin/offers/${o.id}`}
                      flash={isFresh(o.updatedAt)}
                    >
                      <Td>
                        <RowHit href={`/admin/offers/${o.id}`}>{title}</RowHit>
                      </Td>
                      <Td>
                        <span
                          className="text-xs text-[color:var(--ro-text-muted)]"
                          dir="ltr"
                        >
                          {o.slug}
                        </span>
                      </Td>
                      <Td>
                        <StatusChip
                          size="sm"
                          {...getStatusChipProps(dict, "offer", o.status)}
                        />
                      </Td>
                      <Td className="font-medium text-[color:var(--ro-text-2)]">
                        {o.dealProposal?.reference ? (
                          <bdi dir="ltr">{o.dealProposal.reference}</bdi>
                        ) : (
                          "—"
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </DataTable>
          </div>
        </>
      )}
    </section>
  );
}
