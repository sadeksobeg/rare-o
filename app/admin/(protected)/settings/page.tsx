import Link from "next/link";
import {
  MessageSquare,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { PortalHeroStrip } from "@/components/admin/portal-hero";
import { StatusChip } from "@/components/ui/status-chip";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { getInboxHealthView } from "@/lib/whatsapp/messaging/inbox";

export const dynamic = "force-dynamic";

export default async function AdminSettingsHubPage() {
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const u = dict.adminUi;
  const session = await getAdminSession();

  const [health, admin] = await Promise.all([
    getInboxHealthView(),
    session
      ? prisma.adminUser.findUnique({
          where: { id: session.sub },
          select: { totpEnabledAt: true, name: true, email: true },
        })
      : Promise.resolve(null),
  ]);

  const waConnected = health.state === "CONNECTED";
  const waLabel = waConnected
    ? u.settingsWaConnected
    : health.state === "DISCONNECTED"
      ? u.settingsWaDisconnected
      : u.settingsWaOther;

  const cards = [
    {
      href: "/admin/profile",
      title: u.settingsProfile,
      lead: u.settingsProfileLead,
      icon: UserRound,
      status: admin?.name || admin?.email || undefined,
      tone: "info" as const,
    },
    {
      href: "/admin/inbox",
      title: u.settingsWhatsApp,
      lead: u.settingsWhatsAppLead,
      icon: MessageSquare,
      status: waLabel,
      tone: waConnected ? ("success" as const) : ("attention" as const),
    },
    {
      href: "/contact",
      title: u.settingsBrand,
      lead: u.settingsBrandLead,
      icon: Store,
      status: undefined,
      tone: "neutral" as const,
    },
    {
      href: "/admin/settings/security",
      title: u.settingsSecurity,
      lead: u.settingsSecurityLead,
      icon: ShieldCheck,
      status: admin?.totpEnabledAt ? u.settings2faOn : u.settings2faOff,
      tone: admin?.totpEnabledAt
        ? ("success" as const)
        : ("attention" as const),
    },
  ] as const;

  return (
    <section className="ro-portal-stagger space-y-6 pb-16">
      <PortalHeroStrip
        eyebrow={ar ? "أشخاص" : "People"}
        title={
          <span className="inline-flex items-center gap-2.5">
            <ShieldCheck
              className="size-7 shrink-0 text-[color:var(--ro-accent-fg,var(--ro-plum-800))]"
              strokeWidth={1.5}
            />
            {u.settingsHubTitle}
          </span>
        }
        subtitle={u.settingsHubLead}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.href}>
              <Link
                href={card.href}
                className="ro-portal-card flex h-full flex-col gap-3 border p-5"
              >
                <span className="ro-portal-icon-well size-10 [&>svg]:size-5">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <h2 className="font-display text-lg font-semibold text-[color:var(--ro-text)]">
                  {card.title}
                </h2>
                <p className="flex-1 text-sm text-[color:var(--ro-text-muted)]">
                  {card.lead}
                </p>
                {card.status ? (
                  <StatusChip size="sm" tone={card.tone} label={card.status} />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
