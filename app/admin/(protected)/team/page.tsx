import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { ButtonLink } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { formatDate, formatRelative } from "@/lib/i18n/format";
import {
  controlClass,
} from "@/lib/ui/form-classes";
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
    <section className="space-y-6 pb-16">
      <PortalHeroStrip
        eyebrow={u.teamTabTeam}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Users
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {u.teamTitle}
          </span>
        }
        subtitle={u.teamLead}
        actions={
          <ButtonLink
            href="/admin/settings/security"
            variant="secondary"
            size="sm"
          >
            <ShieldCheck className="size-4" strokeWidth={1.5} />
            {u.teamSecurityLink}
          </ButtonLink>
        }
        stats={[
          { label: u.teamTabTeam, value: admins.length },
          { label: "2FA", value: with2fa },
          {
            label: u.teamTabAudit,
            value: auditTotal,
          },
        ]}
      />

      <div
        role="tablist"
        aria-label={u.teamTitle}
        className="ro-portal-tablist inline-flex max-w-full"
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
              className={cn(
                "inline-flex h-10 min-h-11 items-center px-4 text-sm transition-[color,background-color] duration-[var(--ro-dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]",
                selected
                  ? "font-semibold text-[color:var(--ro-text)]"
                  : "text-[color:var(--ro-text-2)] hover:text-[color:var(--ro-text)]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {tab === "team" ? (
        <div className="overflow-x-auto rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)]">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[color:var(--ro-border-subtle)] text-xs text-[color:var(--ro-text-muted)]">
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
                    className="border-t border-[color:var(--ro-border-subtle)]"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3 font-medium text-[color:var(--ro-text)]">
                        <span
                          aria-hidden
                          className="flex size-9 items-center justify-center rounded-full bg-[var(--ro-plum-100)] text-sm font-semibold text-[var(--ro-plum-900)]"
                        >
                          {initial}
                        </span>
                        {member.name}
                      </span>
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      {member.email}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip
                        size="sm"
                        tone={member.totpEnabledAt ? "success" : "attention"}
                        label={
                          member.totpEnabledAt
                            ? dict.common.switchOn
                            : dict.common.switchOff
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-[color:var(--ro-text-muted)]">
                      {formatRelative(member.createdAt, locale)}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <Link
                          href="/admin/settings/security"
                          className="text-sm font-medium text-[color:var(--ro-accent-fg,var(--ro-plum-800))] underline-offset-4 hover:underline"
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
          <p className="border-t border-[color:var(--ro-border-subtle)] px-4 py-3 text-xs text-[color:var(--ro-text-muted)]">
            {u.teamInviteNote}
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
                placeholder={u.teamAuditFilter}
                aria-label={u.teamAuditFilter}
                className={cn(controlClass, "h-10 max-w-xs")}
                dir="ltr"
              />
              <button
                type="submit"
                className="h-10 rounded-[var(--ro-r-sm)] bg-[var(--ro-plum-900)] px-4 text-sm font-semibold text-[var(--ro-sand-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ro-focus)]"
              >
                {u.search}
              </button>
            </form>
            <a
              href={`/api/admin/audit-export${actionFilter?.trim() ? `?action=${encodeURIComponent(actionFilter.trim())}` : ""}`}
              className="inline-flex h-10 items-center rounded-[var(--ro-r-sm)] border border-[color:var(--ro-border-control)] px-4 text-sm font-semibold text-[color:var(--ro-text)]"
            >
              {u.teamAuditExport}
            </a>
          </div>
          <p className="text-xs text-[color:var(--ro-text-muted)]">
            {u.teamAuditCount.replace("{n}", String(auditTotal))}
          </p>
          <div className="overflow-x-auto rounded-[var(--ro-r-lg)] border border-[color:var(--ro-border-subtle)] bg-[color:var(--ro-panel)]">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[color:var(--ro-border-subtle)] text-xs text-[color:var(--ro-text-muted)]">
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
                      className="border-t border-[color:var(--ro-border-subtle)]"
                    >
                      <td className="px-4 py-3 text-[color:var(--ro-text-muted)]">
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
                            className="text-[color:var(--ro-accent-fg,var(--ro-plum-800))] underline-offset-2 hover:underline"
                          >
                            {row.target}
                          </Link>
                        ) : (
                          row.target || "—"
                        )}
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-3 text-xs text-[color:var(--ro-text-muted)]" dir="ltr" title={meta ?? undefined}>
                        {meta || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[color:var(--ro-text-muted)]" dir="ltr">
                        {row.ip || "—"}
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
