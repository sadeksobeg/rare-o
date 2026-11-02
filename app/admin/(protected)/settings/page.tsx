import Link from "next/link";
import { MessageSquare, ShieldCheck, Store } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { getRequestDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminSettingsHubPage() {
  const { dict } = await getRequestDictionary();
  const u = dict.adminUi;

  const cards = [
    {
      href: "/admin/inbox",
      title: u.settingsWhatsApp,
      lead: u.settingsWhatsAppLead,
      icon: MessageSquare,
    },
    {
      href: "/contact",
      title: u.settingsBrand,
      lead: u.settingsBrandLead,
      icon: Store,
    },
    {
      href: "/admin/settings/security",
      title: u.settingsSecurity,
      lead: u.settingsSecurityLead,
      icon: ShieldCheck,
    },
  ] as const;

  return (
    <section className="space-y-6">
      <PageHeader
        title={u.settingsHubTitle}
        description={u.settingsHubLead}
        icon={<ShieldCheck className="size-5" strokeWidth={2} />}
      />
      <ul className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.href}>
              <Link
                href={card.href}
                className="ro-portal-card flex h-full flex-col gap-3 border p-5 transition-opacity hover:opacity-95"
              >
                <span className="ro-portal-icon-well size-10 [&>svg]:size-5">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <h2 className="font-display text-lg font-semibold text-ro-ink">
                  {card.title}
                </h2>
                <p className="text-sm text-ro-muted">{card.lead}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
