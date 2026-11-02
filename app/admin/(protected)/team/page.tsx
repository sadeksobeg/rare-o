import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; action?: string }>;
}) {
  const { tab: tabRaw, action: actionFilter } = await searchParams;
  const tab = tabRaw === "audit" ? "audit" : "team";
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";

  const [admins, audits, auditTotal] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        totpEnabledAt: true,
        createdAt: true,
      },
    }),
    prisma.adminAuditLog.findMany({
      where: actionFilter?.trim()
        ? { action: { contains: actionFilter.trim() } }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.adminAuditLog.count(
      actionFilter?.trim()
        ? { where: { action: { contains: actionFilter.trim() } } }
        : undefined
    ),
  ]);

  const adminById = new Map(admins.map((a) => [a.id, a]));

  return (
    <section className="space-y-8">
      <PageHeader
        title={ar ? "الفريق والأمان" : "Team & security"}
        description={
          ar
            ? "حسابات الإدارة الحقيقية — لا أدوار مالك/مدير/موظف في المخطط بعد. التحقق بخطوتين من صفحة الأمان."
            : "Live admin accounts — Owner/Manager/Staff roles are not in the schema yet. Manage 2FA on the security page."
        }
        icon={<Users className="size-5" strokeWidth={1.5} />}
        action={
          <ButtonLink
            href="/admin/settings/security"
            variant="secondary"
            size="sm"
          >
            <ShieldCheck className="size-4" strokeWidth={1.5} />
            {dict.admin.settings}
          </ButtonLink>
        }
      />

      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-[color-mix(in_srgb,var(--ro-plum-900)_14%,transparent)]"
      >
        {(
          [
            { id: "team" as const, label: ar ? "الفريق" : "Team" },
            { id: "audit" as const, label: ar ? "سجل الأمان" : "Audit log" },
          ] as const
        ).map((item) => {
          const selected = tab === item.id;
          return (
            <Link
              key={item.id}
              href={
                item.id === "audit"
                  ? "/admin/team?tab=audit"
                  : "/admin/team?tab=team"
              }
              role="tab"
              aria-selected={selected}
              className={cn(
                "min-h-11 px-4 text-sm font-semibold transition-colors",
                selected
                  ? "border-b-2 border-[var(--ro-plum-900)] text-ro-ink"
                  : "text-[var(--ro-ink-600)] hover:text-ro-ink"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {tab === "team" ? (
        <div className="overflow-x-auto rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)]">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--ro-border-subtle)] text-xs text-[var(--ro-ink-600)]">
              <tr>
                <th className="px-4 py-3 text-start font-medium">
                  {ar ? "الاسم" : "Name"}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {ar ? "البريد" : "Email"}
                </th>
                <th className="px-4 py-3 text-start font-medium">2FA</th>
                <th className="px-4 py-3 text-start font-medium">
                  {ar ? "منذ" : "Since"}
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const initial = a.name.trim().slice(0, 1) || "A";
                return (
                  <tr
                    key={a.id}
                    className="border-t border-[var(--ro-border-subtle)]"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3 font-medium text-ro-ink">
                        <span
                          aria-hidden
                          className="flex size-9 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                        >
                          {initial}
                        </span>
                        {a.name}
                      </span>
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {a.email}
                    </td>
                    <td className="px-4 py-3">
                      {a.totpEnabledAt ? (
                        <span className="rounded-md bg-[var(--ro-success-100)] px-2 py-0.5 text-xs font-medium text-[var(--ro-success-700)]">
                          {dict.common.switchOn}
                        </span>
                      ) : (
                        <span className="rounded-md bg-[var(--ro-amber-100)] px-2 py-0.5 text-xs font-medium text-[var(--ro-amber-800)]">
                          {dict.common.switchOff}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--ro-ink-600)]">
                      {formatRelative(a.createdAt, locale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-[var(--ro-border-subtle)] px-4 py-3 text-xs text-ro-muted">
            {ar
              ? "دعوة أعضاء جدد ومصفوفة الصلاحيات تتطلب حقول أدوار في قاعدة البيانات — غير مُنفَّذة في هذه المرحلة."
              : "Invites and a permission matrix need role fields in the database — not built in this phase."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <form className="flex flex-wrap gap-2" role="search">
              <input type="hidden" name="tab" value="audit" />
              <input
                name="action"
                defaultValue={actionFilter ?? ""}
                placeholder={ar ? "تصفية حسب الإجراء…" : "Filter by action…"}
                aria-label={ar ? "تصفية حسب الإجراء" : "Filter by action"}
                className="h-10 w-full max-w-xs rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] bg-ro-paper px-3 text-sm outline-none focus:border-[var(--ro-plum-900)]"
                dir="ltr"
              />
              <button
                type="submit"
                className="h-10 rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-900)] px-4 text-sm font-semibold text-[var(--ro-sand-50)]"
              >
                {dict.adminUi.search}
              </button>
            </form>
            <a
              href={`/api/admin/audit-export${actionFilter?.trim() ? `?action=${encodeURIComponent(actionFilter.trim())}` : ""}`}
              className="inline-flex h-10 items-center rounded-[var(--ro-r-sm)] border border-[var(--ro-border-control)] px-4 text-sm font-semibold text-ro-ink"
            >
              {ar ? "تصدير CSV" : "Export CSV"}
            </a>
          </div>
          <p className="text-xs text-ro-muted">
            {ar ? `${auditTotal} حدثاً` : `${auditTotal} events`}
          </p>
          <div className="overflow-x-auto rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)]">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[var(--ro-border-subtle)] text-xs text-[var(--ro-ink-600)]">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">
                    {ar ? "متى" : "When"}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {ar ? "من" : "Who"}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {ar ? "الإجراء" : "Action"}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {ar ? "الهدف" : "Target"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {audits.map((row) => {
                  const who = row.adminId
                    ? adminById.get(row.adminId)?.email ?? row.adminId
                    : "—";
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-[var(--ro-border-subtle)]"
                    >
                      <td className="px-4 py-3 text-[var(--ro-ink-600)]">
                        {formatDate(row.createdAt, locale, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {who}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                        {row.action}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                        {row.target || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
