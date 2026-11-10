import {
  OffersListView,
  type OffersListRow,
} from "@/components/admin/rad/offers-list-view";
import { PUBLIC_OFFER_STATUSES } from "@/lib/deals/constants";
import { formatAdminDate } from "@/lib/i18n/admin-format";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listPublicOffersForAdmin } from "@/lib/offers/service";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getStatusChipProps } from "@/lib/ui/status-labels";

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

  const rows: OffersListRow[] = filtered.map((o) => {
    const chip = getStatusChipProps(dict, "offer", o.status);
    const title =
      locale === "ar"
        ? o.titleAr || o.titleEn || o.slug
        : o.titleEn || o.titleAr || o.slug;
    return {
      id: o.id,
      href: `/admin/offers/${o.id}`,
      title,
      slug: o.slug,
      statusLabel: chip.label,
      pillTone: statusToneToPill(chip.tone),
      dealRef: o.dealProposal?.reference ?? null,
      updatedLabel: formatAdminDate(o.updatedAt, locale),
    };
  });

  return (
    <OffersListView
      title={a.offers}
      lead={u.offersLead}
      query={{ tab, q: qRaw?.trim() ?? "" }}
      tabs={[
        { value: "all", label: u.filterAll, count: counts.all },
        ...PUBLIC_OFFER_STATUSES.map((s) => ({
          value: s,
          label: getStatusChipProps(dict, "offer", s).label,
          count: counts[s] ?? 0,
        })),
      ]}
      rows={rows}
      totalFiltered={filtered.length}
      labels={{
        listAria: a.offers,
        statusFilterAria: u.filterTabs,
        searchLabel: u.search,
        searchPlaceholder: ar
          ? "ابحث بالعنوان أو المرجع…"
          : "Search title or reference…",
        colTitle: ar ? "العنوان" : "Title",
        colStatus: a.colStatus,
        colDeal: ar ? "الصفقة" : "Deal",
        colUpdated: ar ? "آخر تحديث" : "Updated",
        colActions: ar ? "إجراءات" : "Actions",
        emptyTitle: u.emptyTitle,
        emptyBody: u.emptyBody,
        noResultsTitle: u.emptyTitle,
        noResultsBody: u.emptyBody,
        clearFilters: dict.catalog.clearFilters,
        resultsSummary: ar
          ? "عرض {n} عرضاً"
          : "Showing {n}",
        newOffer: u.newOffer,
      }}
    />
  );
}
