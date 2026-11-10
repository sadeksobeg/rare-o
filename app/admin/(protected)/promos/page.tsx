import Link from "next/link";
import { Megaphone } from "lucide-react";
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
import { Card, EmptyState, Pill } from "@/components/ui-kit";
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
    <section data-admin-promos="" className="space-y-5 pb-8">
      <header className="rad-phead">
        <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 style={{ fontFamily: "var(--rad-font, inherit)" }}>{a.promos}</h1>
            <p>{u.promosLead}</p>
          </div>
          <div className="rad-pact">
            <Link href="/admin/promos/new" className="rad-btn rad-pri rad-sm">
              {u.newPromo}
            </Link>
          </div>
        </div>
      </header>
      {bands.length === 0 ? (
        <EmptyState
          large
          title={u.emptyTitle}
          body={u.emptyBody}
          icon={
            <Megaphone width={28} height={28} strokeWidth={1.5} aria-hidden />
          }
          action={
            <Link href="/admin/promos/new" className="rad-btn rad-pri rad-sm">
              {u.newPromo}
            </Link>
          }
        />
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
          <Card padded={false} className="hidden overflow-hidden md:block">
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
                      <Td
                        className="text-[color:var(--rad-tx3)]"
                        dir="ltr"
                      >
                        {b.slug}
                      </Td>
                      <Td>
                        <RowHit href={`/admin/promos/${b.id}`}>
                          {title || "—"}
                        </RowHit>
                      </Td>
                      <Td>
                        <Pill
                          tone={b.status === "published" ? "ok" : "no"}
                        >
                          {u.promoStatus[b.status] ?? b.status}
                        </Pill>
                      </Td>
                      <Td>{u.promoTone[b.tone] ?? b.tone}</Td>
                      <Td dir="ltr">{b.sortOrder}</Td>
                      <Td>
                        <Link
                          href={`/admin/promos/${b.id}`}
                          className="underline-offset-2 hover:underline"
                          style={{ color: "var(--rad-ac)" }}
                        >
                          {a.edit}
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </DataTable>
          </Card>
        </>
      )}
    </section>
  );
}
