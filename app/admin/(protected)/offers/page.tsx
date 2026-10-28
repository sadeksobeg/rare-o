import Link from "next/link";
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
import { Percent } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { getRequestDictionary } from "@/lib/i18n/server";
import { isFresh } from "@/lib/ui/fresh";
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
        icon={<Percent className="size-5" strokeWidth={2} />}
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
        <>
          <AdminRecordCardList>
            {offers.map((o) => {
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
                  actionLabel={a.edit}
                />
              );
            })}
          </AdminRecordCardList>
          <div className="hidden md:block">
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
                <Tr key={o.id} flash={isFresh(o.updatedAt)}>
                  <Td className="text-ro-muted" dir="ltr">
                    {o.slug}
                  </Td>
                  <Td>
                    <RowHit href={`/admin/offers/${o.id}`}>{title}</RowHit>
                  </Td>
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
          </div>
        </>
      )}
    </section>
  );
}
