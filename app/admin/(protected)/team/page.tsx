import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatRelative } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const [admins, audits] = await Promise.all([
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
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <section className="space-y-8">
      <PageHeader
        title={ar ? "الفريق والأمان" : "Team & security"}
        description={
          ar
            ? "حسابات الإدارة الحقيقية من قاعدة البيانات — المصادقة الثنائية من صفحة الأمان"
            : "Live admin accounts from the database — manage 2FA on the security page"
        }
        icon={<Users className="size-5" strokeWidth={1.5} />}
        action={
          <ButtonLink href="/admin/settings/security" variant="secondary" size="sm">
            <ShieldCheck className="size-4" strokeWidth={1.5} />
            {dict.admin.settings}
          </ButtonLink>
        }
      />

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
            {admins.map((a) => (
              <tr
                key={a.id}
                className="border-t border-[var(--ro-border-subtle)]"
              >
                <td className="px-4 py-3 font-medium text-ro-ink">{a.name}</td>
                <td className="px-4 py-3" dir="ltr">
                  {a.email}
                </td>
                <td className="px-4 py-3">
                  {a.totpEnabledAt ? (
                    <span className="rounded-md bg-[var(--ro-success-100)] px-2 py-0.5 text-xs font-medium text-[var(--ro-success-700)]">
                      {ar ? "مفعّل" : "On"}
                    </span>
                  ) : (
                    <span className="rounded-md bg-[var(--ro-amber-100)] px-2 py-0.5 text-xs font-medium text-[var(--ro-amber-800)]">
                      {ar ? "غير مفعّل" : "Off"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--ro-ink-600)]">
                  {formatRelative(a.createdAt, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-[var(--ro-r-lg)] border border-[var(--ro-border-subtle)] bg-[var(--ro-sand-50)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            {ar ? "سجل التدقيق الأخير" : "Recent audit log"}
          </h2>
          <Link
            href="/admin/settings/security"
            className="text-xs font-medium text-[var(--ro-plum-900)] underline-offset-2 hover:underline"
          >
            {ar ? "الأمان / 2FA" : "Security / 2FA"}
          </Link>
        </div>
        {audits.length === 0 ? (
          <p className="text-sm text-[var(--ro-ink-600)]">
            {ar
              ? "لا أحداث تدقيق بعد — تظهر هنا بعد عمليات حساسة."
              : "No audit events yet — sensitive admin actions appear here."}
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audits.map((e) => (
              <li
                key={e.id}
                className="border-s-2 border-[var(--ro-plum-300)] ps-3"
              >
                <span className="text-xs text-[var(--ro-ink-500)]" dir="ltr">
                  {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
                <p className="font-medium text-ro-ink">{e.action}</p>
                {e.target ? (
                  <p className="text-[var(--ro-ink-600)]">{e.target}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
