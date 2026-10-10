import Link from "next/link";
import {
  DataTable,
  DataTableHead,
  Td,
  Th,
  Tr,
} from "@/components/admin/data-table";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { getRequestDictionary } from "@/lib/i18n/server";
import { listPublicOffersForAdmin } from "@/lib/offers/service";
import { getStatusChipProps } from "@/lib/ui/status-labels";

export default async function AdminOffersPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const offers = await listPublicOffersForAdmin();

  return (
    <section className="space-y-6">
      <PageHeader
        title={a.offers}
        description={u.offersLead}
        action={
          <ButtonLink href="/admin/offers/new" variant="primary" size="sm">
            {u.newOffer}
          </ButtonLink>
        }
      />
      {offers.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState
            title={u.emptyTitle}
            body={u.emptyBody}
            actionHref="/admin/offers/new"
            actionLabel={u.newOffer}
          />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <Th>{a.colSlug}</Th>
            <Th>{u.colTitle}</Th>
            <Th>{a.colStatus}</Th>
            <Th>{u.colDeal}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {offers.map((o) => {
              const title =
                locale === "ar"
                  ? o.titleAr || o.titleEn
                  : o.titleEn || o.titleAr;
              return (
                <Tr key={o.id}>
                  <Td className="text-ro-muted" dir="ltr">
                    {o.slug}
                  </Td>
                  <Td className="font-medium">{title}</Td>
                  <Td>
                    <StatusChip
                      size="sm"
                      {...getStatusChipProps(dict, "offer", o.status)}
                    />
                  </Td>
                  <Td>{o.dealProposal?.reference ?? "—"}</Td>
                  <Td>
                    <Link
                      href={`/admin/offers/${o.id}`}
                      className="text-ro-plum hover:underline"
                    >
                      {a.edit}
                    </Link>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
