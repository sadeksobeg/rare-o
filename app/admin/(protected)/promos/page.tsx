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
import { listPromoBandsForAdmin } from "@/lib/promos/service";

export default async function AdminPromosPage() {
  const { locale, dict } = await getRequestDictionary();
  const a = dict.admin;
  const u = dict.adminUi;
  const bands = await listPromoBandsForAdmin();

  return (
    <section className="space-y-6">
      <PageHeader
        title={a.promos}
        description={u.promosLead}
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
                <Tr key={b.id}>
                  <Td className="text-ro-muted" dir="ltr">
                    {b.slug}
                  </Td>
                  <Td className="font-medium">{title || "—"}</Td>
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
      )}
    </section>
  );
}
