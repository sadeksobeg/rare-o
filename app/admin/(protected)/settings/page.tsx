import Link from "next/link";
import {
  MessageSquare,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { Card, Pill } from "@/components/ui-kit";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { getRequestDictionary } from "@/lib/i18n/server";
import { statusToneToPill } from "@/lib/ui/pill-tone";
import { getInboxHealthView } from "@/lib/whatsapp/messaging/inbox";
import type { StatusTone } from "@/lib/ui/status";

export const dynamic = "force-dynamic";

export default async function AdminSettingsHubPage() {
  const { dict } = await getRequestDictionary();
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
      tone: "info" as StatusTone,
    },
    {
      href: "/admin/inbox",
      title: u.settingsWhatsApp,
      lead: u.settingsWhatsAppLead,
      icon: MessageSquare,
      status: waLabel,
      tone: (waConnected ? "success" : "attention") as StatusTone,
    },
    {
      href: "/contact",
      title: u.settingsBrand,
      lead: u.settingsBrandLead,
      icon: Store,
      status: undefined as string | undefined,
      tone: "neutral" as StatusTone,
    },
    {
      href: "/admin/settings/security",
      title: u.settingsSecurity,
      lead: u.settingsSecurityLead,
      icon: ShieldCheck,
      status: admin?.totpEnabledAt ? u.settings2faOn : u.settings2faOff,
      tone: (admin?.totpEnabledAt ? "success" : "attention") as StatusTone,
    },
  ] as const;

  return (
    <section data-admin-settings="" className="space-y-5 pb-16">
      <header className="rad-phead">
        <div className="min-w-0">
          <h1 style={{ fontFamily: "var(--rad-font, inherit)" }}>
            {u.settingsHubTitle}
          </h1>
          <p>{u.settingsHubLead}</p>
        </div>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.href}>
              <Link href={card.href} className="block h-full">
                <Card className="flex h-full flex-col gap-3 !p-5 transition-[background-color,border-color] hover:bg-[color:var(--rad-surface3)]">
                  <span
                    className="inline-flex size-10 items-center justify-center rounded-[11px] border"
                    style={{
                      borderColor: "var(--rad-bd)",
                      background: "var(--rad-surface2)",
                      color: "var(--rad-ac)",
                    }}
                  >
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <h2
                    className="text-lg font-semibold"
                    style={{
                      color: "var(--rad-tx)",
                      fontFamily: "var(--rad-font, inherit)",
                    }}
                  >
                    {card.title}
                  </h2>
                  <p
                    className="flex-1 text-sm"
                    style={{ color: "var(--rad-tx3)" }}
                  >
                    {card.lead}
                  </p>
                  {card.status ? (
                    <Pill tone={statusToneToPill(card.tone)}>{card.status}</Pill>
                  ) : null}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
