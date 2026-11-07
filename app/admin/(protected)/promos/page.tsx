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
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { isPromoFeaturesEnabled } from "@/lib/config/feature-flags";
import { getRequestDictionary } from "@/lib/i18n/server";
import { isFresh } from "@/lib/ui/fresh";
import { listPromoBandsForAdmin } from "@/lib/promos/service";
import { notFound } from "next/navigation";

export default async function AdminPromosPage() {
  if (!isPromoFeaturesEnabled()) notFound();
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const bands = await listPromoBandsForAdmin();

  return (
    <section className="space-y-6">
      <PageHeader
        title={a.promos}
        description={u.promosLead}
        icon={<Megaphone className="size-5" strokeWidth={1.5} />}
        action={
          <ButtonLink href="/admin/promos/new" variant="primary" size="sm">
            {u.newPromo}
          </ButtonLink>
        }
      />
      {bands.length === 0 ? (
        <div className="border border-ro-line">
          <EmptyState
            title={u.emptyTitle}
            body={u.emptyBody}
            actionHref="/admin/promos/new"
            actionLabel={u.newPromo}
          />
        </div>
      ) : (
        <>
          <AdminRecordCardList>
            {bands.map((b) => {
              const title =
                locale === "ar"
                  ? b.titleAr || b.titleEn
                  : b.titleEn || b.titleAr;
              return (
                <AdminRecordCard
                  key={b.id}
                  href={`/admin/promos/${b.id}`}
                  flash={isFresh(b.updatedAt)}
                  title={title || b.slug}
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
            <Th>{u.form.tone}</Th>
            <Th>{u.form.sortOrder}</Th>
            <Th />
          </DataTableHead>
          <tbody>
            {bands.map((b) => {
              const title =
                locale === "ar"
                  ? b.titleAr || b.titleEn
                  : b.titleEn || b.titleAr;
              return (
                <Tr
                  key={b.id}
                  href={`/admin/promos/${b.id}`}
                  flash={isFresh(b.updatedAt)}
                >
                  <Td className="text-ro-muted" dir="ltr">
                    {b.slug}
                  </Td>
                  <Td>
                    <RowHit href={`/admin/promos/${b.id}`}>
                      {title || "—"}
                    </RowHit>
                  </Td>
                  <Td>
                    <StatusChip
                      size="sm"
                      tone={b.status === "published" ? "success" : "neutral"}
                      label={u.promoStatus[b.status] ?? b.status}
                    />
                  </Td>
                  <Td>{u.promoTone[b.tone] ?? b.tone}</Td>
                  <Td dir="ltr">{b.sortOrder}</Td>
                  <Td>
                    <Link
                      href={`/admin/promos/${b.id}`}
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
