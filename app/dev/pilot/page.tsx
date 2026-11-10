import { notFound } from "next/navigation";
import {
  AdminDashboardContent,
  type AdminHomeData,
} from "@/components/admin/rad/dashboard-content";
import { greetingHeadline } from "@/lib/i18n/greeting";
import { getRequestDictionary } from "@/lib/i18n/server";

export const metadata = { title: "dev: AD-02 rich-data fixture" };

/**
 * Rich-data fixture for the AD-02 visual-matching gate (owner round 2.1,
 * item 3). Dev-only — notFound() in production, and nothing here ever
 * touches the database, so it carries zero production risk. Numbers are
 * loosely modelled on the owner's reference "rich" demo scenario
 * (docs/ui/reference/admin-dashboard/index.html, DATA.rich), restated for
 * RARE OUD's own real record shapes rather than copied verbatim.
 */
function buildRichFixture(): AdminHomeData {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600_000);
  const daysAgo = (d: number) => new Date(now - d * 86_400_000);

  const wave = (seed: number, amp: number, base: number) =>
    Array.from({ length: 30 }, (_, i) =>
      Math.max(0, Math.round(base + amp * Math.sin(i * 0.6 + seed) + amp * 0.4 * Math.sin(i * 1.7 + seed * 2)))
    );

  const retail30 = wave(1, 4, 5);
  const deal30 = wave(2, 2, 2);
  const wholesale30 = wave(3, 2, 3);
  const inbox30 = wave(4, 5, 6);
  const trend30 = retail30.map((v, i) => v + deal30[i]! + wholesale30[i]!);

  const series = (points: number[]) => ({
    points: points.slice(-7),
    today: points[points.length - 1] ?? 0,
    yesterday: points[points.length - 2] ?? 0,
  });

  return {
    kpis: {
      retailAwaitingAdmin: 37,
      dealsAwaitingAdmin: 6,
      wholesaleAwaitingAdmin: 9,
      unreadConversations: 12,
      activeBrokerage: 4,
    },
    series: {
      retail: series(retail30),
      deals: series(deal30),
      wholesale: series(wholesale30),
      inbox: series(inbox30),
    },
    requestsTrend: { points: trend30, total: trend30.reduce((a, b) => a + b, 0) },
    catalogHealth: { published: 46, withPhoto: 41, missingPhoto: 5 },
    manageHub: {
      publishedProducts: 46,
      traders: 18,
      customers: 112,
      unreadConversations: 12,
    },
    pipeline: {
      ready_for_handoff: 9,
      in_follow_up: 14,
      handoff_opened: 11,
      completed: 58,
    },
    lastWhatsAppAt: hoursAgo(1),
    health: {
      state: "CONNECTED",
      rawState: "CONNECTED",
      detailSafe: null,
      lastConnectedAt: hoursAgo(1).toISOString(),
      lastHeartbeatAt: hoursAgo(0.01).toISOString(),
      updatedAt: hoursAgo(0.2).toISOString(),
      outboundEnabled: false,
      outboundKillSwitch: false,
      outboundKillSwitchAt: null,
      outboundKillSwitchBy: null,
      outboundKillSwitchReason: null,
      outboundGlobalRatePerMin: 20,
      pairingPhone: null,
      pairingCode: null,
      qrDataUrl: null,
      pairingExpiresAt: null,
      linkCommand: "none",
    },
    actionQueue: [
      { id: "f1", domain: "deal", title: "المتجر الذهبي · عرض سعر 1,250$", href: "/admin/deals/f1", ageAt: hoursAgo(2), status: "negotiating", reference: "DL-2026-0412", subtitle: "بانتظار ردّك" },
      { id: "f2", domain: "wholesale", title: "دار الأوتار · 24 قطعة", href: "/admin/wholesale/f2", ageAt: hoursAgo(5), status: "under_review", reference: "WH-2026-0187", subtitle: "عرض سعر مطلوب" },
      { id: "f3", domain: "retail", title: "عود VIP", href: "/admin/requests/f3", ageAt: hoursAgo(8), status: "ready_for_handoff", reference: "RO-2026-8801", subtitle: "", lineCount: 1 },
      { id: "f4", domain: "deal", title: "دار الطرب · تفاوض على السعر", href: "/admin/deals/f4", ageAt: daysAgo(1), status: "negotiating", reference: "DL-2026-0409", subtitle: "بانتظار ردّك" },
      { id: "f5", domain: "retail", title: "قانون محترف", href: "/admin/requests/f5", ageAt: daysAgo(1), status: "ready_for_handoff", reference: "RO-2026-8794", subtitle: "", lineCount: 1 },
      { id: "f6", domain: "wholesale", title: "مؤسسة الأنغام · شحن جاهز", href: "/admin/wholesale/f6", ageAt: daysAgo(2), status: "quote_provided", reference: "WH-2026-0183", subtitle: "جاهز للشحن" },
      { id: "f7", domain: "retail", title: "عود متوسط", href: "/admin/requests/f7", ageAt: daysAgo(3), status: "ready_for_handoff", reference: "RO-2026-8760", subtitle: "", lineCount: 2 },
      { id: "f8", domain: "deal", title: "صفقة خارج الكتالوج", href: "/admin/deals/f8", ageAt: daysAgo(3), status: "proposed", reference: "DL-2026-0401", subtitle: "قيد المراجعة" },
    ],
    activityFeed: [
      { id: "e1", domain: "deal", reference: "DL-2026-0412", eventKey: "continue", href: "/admin/deals/f1", at: hoursAgo(2), actor: "trader" },
      { id: "e2", domain: "wholesale", reference: "WH-2026-0187", eventKey: "submitted", href: "/admin/wholesale/f2", at: hoursAgo(5), actor: "trader" },
      { id: "e3", domain: "retail", reference: "RO-2026-8744", eventKey: "completed", href: "/admin/requests/e3", at: hoursAgo(14), actor: "admin" },
      { id: "e4", domain: "deal", reference: "DL-2026-0409", eventKey: "counter", href: "/admin/deals/f4", at: daysAgo(1), actor: "admin" },
      { id: "e5", domain: "wholesale", reference: "WH-2026-0183", eventKey: "quote_provided", href: "/admin/wholesale/f6", at: daysAgo(2), actor: "admin" },
    ],
  };
}

export default async function DevPilotPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { locale, dict } = await getRequestDictionary();
  const greeting = greetingHeadline("صادق", dict.common);
  const data = buildRichFixture();

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <div
        className="ro-portal ro-portal-admin rad-root"
        data-portal="admin"
        data-theme="dark"
        style={{ minHeight: "100vh", background: "var(--rad-c0)" }}
      >
        <div className="rad-main" style={{ minHeight: "100vh" }}>
          <main className="rad-page">
            <AdminDashboardContent locale={locale} dict={dict} greeting={greeting} data={data} />
          </main>
        </div>
      </div>
    </div>
  );
}
