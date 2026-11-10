import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Avatar, Card, Pill } from "@/components/ui-kit";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function summarizeMeta(metaJson: string): string | null {
  try {
    const parsed = JSON.parse(metaJson || "{}") as Record<string, unknown>;
    const keys = Object.keys(parsed);
    if (keys.length === 0) return null;
    return keys
      .slice(0, 4)
      .map((k) => {
        const v = parsed[k];
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          return `${k}=${String(v)}`;
        }
        return k;
      })
      .join(" · ");
  } catch {
    return null;
  }
}

function targetHref(target: string): string | null {
  if (!target) return null;
  if (target.startsWith("customer:")) {
    return `/admin/customers/${target.slice("customer:".length)}`;
  }
  if (target.startsWith("trader:")) {
    return `/admin/traders/${target.slice("trader:".length)}`;
  }
  if (target.startsWith("/admin/")) return target;
  return null;
}

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; action?: string }>;
}) {
  const { tab: tabRaw, action: actionFilter } = await searchParams;
  const tab = tabRaw === "audit" ? "audit" : "team";
  const { locale, dict } = await getRequestDictionary();
  const u = dict.adminUi;
  const session = await getAdminSession();

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
  const with2fa = admins.filter((a) => a.totpEnabledAt).length;

  return (
    <section data-admin-team="" className="space-y-5 pb-16">
      <header className="rad-phead">
        <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 style={{ fontFamily: "var(--rad-font, inherit)" }}>
              {u.teamTitle}
            </h1>
            <p>
              {u.teamLead}
              {" · "}
              <span className="tabular-nums">
                {admins.length} {u.teamTabTeam} · {with2fa} 2FA · {auditTotal}{" "}
                {u.teamTabAudit}
              </span>
            </p>
          </div>
          <div className="rad-pact">
            <Link
              href="/admin/settings/security"
              className="rad-btn rad-gh rad-sm"
            >
              <ShieldCheck className="size-4" strokeWidth={1.5} aria-hidden />
              {u.teamSecurityLink}
            </Link>
          </div>
        </div>
      </header>

      <div
        role="tablist"
        aria-label={u.teamTitle}
        className="rad-seg inline-flex max-w-full"
      >
        {(
          [
            { id: "team" as const, label: u.teamTabTeam },
            { id: "audit" as const, label: u.teamTabAudit },
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
              className={cn(selected && "rad-on")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {tab === "team" ? (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead
                className="border-b text-xs"
                style={{
                  borderColor: "var(--rad-bd)",
                  color: "var(--rad-tx3)",
                }}
              >
                <tr>
                  <th className="px-4 py-3 text-start font-medium">
                    {u.teamColName}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">
                    {u.teamColEmail}
                  </th>
                  <th className="px-4 py-3 text-start font-medium">2FA</th>
                  <th className="px-4 py-3 text-start font-medium">
                    {u.teamColSince}
                  </th>
                  <th className="px-4 py-3 text-start font-medium" />
                </tr>
              </thead>
              <tbody>
                {admins.map((member) => {
                  const initial = member.name.trim().slice(0, 1) || "A";
                  const isSelf = session?.sub === member.id;
                  return (
                    <tr
                      key={member.id}
                      className="border-t"
                      style={{ borderColor: "var(--rad-bd)" }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="flex items-center gap-3 font-medium"
                          style={{ color: "var(--rad-tx)" }}
                        >
                          <Avatar size="sm" gradient="g2">
                            {initial}
                          </Avatar>
                          {member.name}
                        </span>
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={member.totpEnabledAt ? "ok" : "warn"}>
                          {member.totpEnabledAt
                            ? dict.common.switchOn
                            : dict.common.switchOff}
                        </Pill>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--rad-tx3)" }}
                      >
                        {formatRelative(member.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <Link
                            href="/admin/settings/security"
                            className="text-sm font-medium underline-offset-4 hover:underline"
                            style={{ color: "var(--rad-ac)" }}
                          >
                            {u.teamSecurityLink}
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p
            className="border-t px-4 py-3 text-xs"
            style={{
              borderColor: "var(--rad-bd)",
              color: "var(--rad-tx3)",
            }}
          >
            {u.teamInviteNote}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <form className="flex flex-wrap gap-2" role="search">
              <input type="hidden" name="tab" value="audit" />
              <input
                name="action"
                defaultValue={actionFilter ?? ""}
                placeholder={u.teamAuditFilter}
                aria-label={u.teamAuditFilter}
                className="rad-inp h-10 max-w-xs"
                dir="ltr"
              />
              <button type="submit" className="rad-btn rad-pri rad-sm">
                {u.search}
              </button>
            </form>
            <a
              href={`/api/admin/audit-export${actionFilter?.trim() ? `?action=${encodeURIComponent(actionFilter.trim())}` : ""}`}
              className="rad-btn rad-gh rad-sm"
            >
              {u.teamAuditExport}
            </a>
          </div>
          <p className="text-xs" style={{ color: "var(--rad-tx3)" }}>
            {u.teamAuditCount.replace("{n}", String(auditTotal))}
          </p>
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead
                  className="border-b text-xs"
                  style={{
                    borderColor: "var(--rad-bd)",
                    color: "var(--rad-tx3)",
                  }}
                >
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">
                      {locale === "ar" ? "متى" : "When"}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {locale === "ar" ? "من" : "Who"}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {locale === "ar" ? "الإجراء" : "Action"}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {locale === "ar" ? "الهدف" : "Target"}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {u.teamAuditMeta}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {u.teamAuditIp}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((row) => {
                    const who = row.adminId
                      ? adminById.get(row.adminId)?.email ?? row.adminId
                      : "—";
                    const href = targetHref(row.target);
                    const meta = summarizeMeta(row.metaJson);
                    return (
                      <tr
                        key={row.id}
                        className="border-t"
                        style={{ borderColor: "var(--rad-bd)" }}
                      >
                        <td
                          className="px-4 py-3"
                          style={{ color: "var(--rad-tx3)" }}
                        >
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
                          {href ? (
                            <Link
                              href={href}
                              className="underline-offset-2 hover:underline"
                              style={{ color: "var(--rad-ac)" }}
                            >
                              {row.target}
                            </Link>
                          ) : (
                            row.target || "—"
                          )}
                        </td>
                        <td
                          className="max-w-[14rem] truncate px-4 py-3 text-xs"
                          style={{ color: "var(--rad-tx3)" }}
                          dir="ltr"
                          title={meta ?? undefined}
                        >
                          {meta || "—"}
                        </td>
                        <td
                          className="px-4 py-3 font-mono text-xs"
                          style={{ color: "var(--rad-tx3)" }}
                          dir="ltr"
                        >
                          {row.ip || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}
