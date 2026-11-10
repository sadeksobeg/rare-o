import type { BrokerageTableRow } from "@/components/admin/rad/brokerage-table";
import type { CustomersListRow, CustomersListTab } from "@/components/admin/rad/customers-list-view";
import type { DealsListRow, DealsListTab } from "@/components/admin/rad/deals-list-view";
import type {
  RequestsListRow,
  RequestsListTab,
} from "@/components/admin/rad/requests-list-view";
import type { WholesaleListRow, WholesaleListTab } from "@/components/admin/rad/wholesale-list-view";
import { DEAL_STATUSES } from "@/lib/deals/constants";
import { RETAIL_REQUEST_STATUSES } from "@/lib/retail-request/constants";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  formatAdminDate,
  formatAdminListCreated,
  formatAdminMoney,
} from "@/lib/i18n/admin-format";
import type { Locale } from "@/lib/i18n/config";
import { adminPillToneForStatus } from "@/lib/ui/status-tone";
import { getStatusLabel } from "@/lib/ui/status-labels";
import { WHOLESALE_STATUSES } from "@/lib/wholesale/constants";

const MASKS = [
  "+963 9•• ••• 003",
  "+963 9•• ••• 118",
  "+971 5• ••• 4421",
  "+966 5• ••• 8802",
  "+962 7• ••• 5510",
];

const CUSTOMER_NAMES = [
  "أحمد السعيد",
  "ليلى الخطيب",
  "محمد العودي",
  "سارة المنصور",
  "خالد الحمصي",
  "نورا الفارس",
  "يوسف الشامي",
  "مريم القاسم",
  "عمر الحلبي",
  "رنا دمشق",
  "فادي البيروتي",
  "دانة عمان",
];

const TRADER_NAMES = [
  "دار الأنغام",
  "مؤسسة الطرب",
  "متجر الذهبي",
  "بيت العود",
  "أوتار الشرق",
  "مجموعة النور",
  "تجّار الدمشق",
  "سوق الحرير",
];

const PRODUCT_AR = [
  "عود كمبودي فاخر",
  "دهن عود ملكي",
  "مبخرة نحاسية",
  "عود هندي قديم",
  "مسك أبيض",
  "عنبر طبيعي",
  "عود بورمي نادر",
  "بخور دمشقي",
];

export function buildRequestsFixture(
  dict: Dictionary,
  locale: string
): { rows: RequestsListRow[]; tabs: RequestsListTab[]; total: number } {
  const u = dict.adminUi;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const statusLabel = (s: string) => getStatusLabel(dict, "retail", s);

  /** Pixel-match fixture — same rows as docs/ui/ui-kit/admin-requests-list.html `R`. */
  const refRows: Array<{
    reference: string;
    customerName: string;
    customerPhone: string;
    productLabel: string;
    moreCount: number;
    valueOnRequest: boolean;
    subtotal: number;
    currency: string;
    status: "draft" | "ready_for_handoff" | "handoff_opened" | "in_follow_up" | "completed" | "cancelled";
    handoff: "opened" | "prepared" | "none";
    createdAt: string;
  }> = [
    {
      reference: "RO-1042",
      customerName: "خالد المصري",
      customerPhone: "+963 9•• ••• 412",
      productLabel: "عود كلاسيكي — كبير",
      moreCount: 1,
      valueOnRequest: false,
      subtotal: 840,
      currency: "USD",
      status: "ready_for_handoff",
      handoff: "prepared",
      createdAt: "2026-11-09T09:42:00+03:00",
    },
    {
      reference: "RO-1041",
      customerName: "ليلى الحداد",
      customerPhone: "+963 9•• ••• 653",
      productLabel: "وتر نايلون مجموعة",
      moreCount: 0,
      valueOnRequest: false,
      subtotal: 45,
      currency: "USD",
      status: "in_follow_up",
      handoff: "none",
      createdAt: "2026-11-09T08:55:00+03:00",
    },
    {
      reference: "RO-1040",
      customerName: "سامر الأتاسي",
      customerPhone: "+963 9•• ••• 530",
      productLabel: "عود مصري فاخر",
      moreCount: 0,
      valueOnRequest: true,
      subtotal: 0,
      currency: "USD",
      status: "ready_for_handoff",
      handoff: "none",
      createdAt: "2026-11-08T23:10:00+03:00",
    },
    {
      reference: "RO-1039",
      customerName: "نور العلي",
      customerPhone: "+963 9•• ••• 118",
      productLabel: "حقيبة عود صلبة",
      moreCount: 2,
      valueOnRequest: false,
      subtotal: 210,
      currency: "USD",
      status: "handoff_opened",
      handoff: "opened",
      createdAt: "2026-11-08T14:30:00+03:00",
    },
    {
      reference: "RO-1038",
      customerName: "رنا القباني",
      customerPhone: "+963 9•• ••• 774",
      productLabel: "عود كلاسيكي — صغير",
      moreCount: 0,
      valueOnRequest: false,
      subtotal: 560,
      currency: "USD",
      status: "completed",
      handoff: "opened",
      createdAt: "2026-11-07T15:40:00+03:00",
    },
    {
      reference: "RO-1037",
      customerName: "محمود الشامي",
      customerPhone: "+963 9•• ••• 291",
      productLabel: "ريشة جلد طبيعي",
      moreCount: 1,
      valueOnRequest: false,
      subtotal: 18,
      currency: "USD",
      status: "in_follow_up",
      handoff: "none",
      createdAt: "2026-11-07T11:04:00+03:00",
    },
    {
      reference: "RO-1036",
      customerName: "أبو فادي",
      customerPhone: "+963 9•• ••• 906",
      productLabel: "عود تركي",
      moreCount: 0,
      valueOnRequest: true,
      subtotal: 0,
      currency: "USD",
      status: "handoff_opened",
      handoff: "opened",
      createdAt: "2026-11-05T20:15:00+03:00",
    },
    {
      reference: "RO-1035",
      customerName: "هدى السيد",
      customerPhone: "+963 9•• ••• 321",
      productLabel: "حامل عود خشبي",
      moreCount: 0,
      valueOnRequest: false,
      subtotal: 95,
      currency: "USD",
      status: "completed",
      handoff: "none",
      createdAt: "2026-11-04T10:00:00+03:00",
    },
  ];

  const rows: RequestsListRow[] = refRows.map((r, i) => {
    const created = formatAdminListCreated(r.createdAt, loc);
    const valueLabel = r.valueOnRequest
      ? u.onRequestPrice
      : formatAdminMoney(r.subtotal, r.currency, loc);
    return {
      id: `fix-req-${r.reference}`,
      reference: r.reference,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      status: r.status,
      statusLabel: statusLabel(r.status),
      pillTone: adminPillToneForStatus("retail", r.status),
      itemCount: 1 + r.moreCount,
      productLabel: r.productLabel,
      moreCount: r.moreCount,
      valueLabel,
      valueOnRequest: r.valueOnRequest,
      handoffLabel:
        r.handoff === "opened"
          ? u.handoffOpened
          : r.handoff === "prepared"
            ? u.handoffPrepared
            : u.handoffNone,
      createdLabel: created.primary,
      createdSecondary: created.secondary,
      href: `/admin/requests/fix-req-${i}`,
      fresh: i === 0,
    };
  });

  const counts: Record<string, number> = { all: rows.length, waiting: 0 };
  for (const s of RETAIL_REQUEST_STATUSES) {
    counts[s] = rows.filter((r) => r.status === s).length;
  }
  counts.waiting =
    (counts.ready_for_handoff ?? 0) +
    (counts.handoff_opened ?? 0) +
    (counts.in_follow_up ?? 0);

  const tabs: RequestsListTab[] = [
    { value: "all", label: u.filterAll, count: counts.all },
    { value: "waiting", label: u.filterWaiting, count: counts.waiting },
    ...RETAIL_REQUEST_STATUSES.map((s) => ({
      value: s,
      label: statusLabel(s),
      count: counts[s] ?? 0,
    })),
  ];

  return { rows, tabs, total: rows.length };
}

export function buildDealsFixture(
  dict: Dictionary
): { rows: DealsListRow[]; tabs: DealsListTab[]; total: number } {
  const u = dict.adminUi;
  const statusLabel = (s: string) =>
    getStatusLabel(dict, "deal", s) || dict.trader.dealStatus[s] || s;

  const refs = [
    "DL-2026-0418",
    "DL-2026-0412",
    "DL-2026-0409",
    "DL-2026-0405",
    "DL-2026-0398",
    "DL-2026-0391",
    "DL-2026-0384",
    "DL-2026-0377",
    "DL-2026-0370",
    "DL-2026-0362",
  ];

  const rows: DealsListRow[] = refs.map((reference, i) => {
    const status = DEAL_STATUSES[i % DEAL_STATUSES.length]!;
    const waiting = i % 3 === 0;
    return {
      id: `fix-deal-${i}`,
      reference,
      title: `صفقة ${PRODUCT_AR[i % PRODUCT_AR.length]}`,
      traderName: TRADER_NAMES[i % TRADER_NAMES.length]!,
      traderEmail: `trader${i}@fixture.local`,
      kindLabel: i % 2 === 0 ? u.kindCatalog : u.kindNonCatalog,
      statusLabel: statusLabel(status),
      pillTone: adminPillToneForStatus("deal", status),
      waiting,
      waitingLabel: u.waitingOnYou,
      entries: (i % 5) + 1,
      href: `/admin/deals/fix-deal-${i}`,
    };
  });

  const rowStatuses = refs.map((_, i) => DEAL_STATUSES[i % DEAL_STATUSES.length]!);

  const tabs: DealsListTab[] = [
    { value: "all", label: u.filterAll, count: rows.length },
    {
      value: "waiting",
      label: u.filterWaiting,
      count: rows.filter((r) => r.waiting).length,
    },
    ...DEAL_STATUSES.map((s) => ({
      value: s,
      label: statusLabel(s),
      count: rowStatuses.filter((st) => st === s).length,
    })),
  ];

  return { rows, tabs, total: rows.length };
}

export function buildWholesaleFixture(
  dict: Dictionary
): { rows: WholesaleListRow[]; tabs: WholesaleListTab[]; total: number } {
  const u = dict.adminUi;
  const statusLabel = (s: string) =>
    getStatusLabel(dict, "wholesale", s) || dict.trader.wholesaleStatus[s] || s;

  const refs = [
    "WH-2026-0194",
    "WH-2026-0187",
    "WH-2026-0183",
    "WH-2026-0179",
    "WH-2026-0172",
    "WH-2026-0168",
    "WH-2026-0161",
    "WH-2026-0155",
    "WH-2026-0148",
    "WH-2026-0142",
  ];

  const rows: WholesaleListRow[] = refs.map((reference, i) => {
    const status = WHOLESALE_STATUSES[i % WHOLESALE_STATUSES.length]!;
    const waiting = i % 4 === 1;
    return {
      id: `fix-wh-${i}`,
      reference,
      traderName: TRADER_NAMES[i % TRADER_NAMES.length]!,
      traderEmail: `wholesale${i}@fixture.local`,
      modeLabel: i % 2 === 0 ? u.modeRequestQuote : u.modeProposePrice,
      statusLabel: statusLabel(status),
      pillTone: adminPillToneForStatus("wholesale", status),
      waiting,
      waitingLabel: u.waitingOnYou,
      shipping: i % 3 === 0 ? `DHL · WH-TRK-${1000 + i}` : u.shippingPlaceholder,
      lines: (i % 6) + 3,
      href: `/admin/wholesale/fix-wh-${i}`,
    };
  });

  const counts: Record<string, number> = {
    all: rows.length,
    waiting: rows.filter((r) => r.waiting).length,
  };

  const tabs: WholesaleListTab[] = [
    { value: "all", label: u.filterAll, count: counts.all },
    { value: "waiting", label: u.filterWaiting, count: counts.waiting },
    ...WHOLESALE_STATUSES.map((s) => ({
      value: s,
      label: statusLabel(s),
      count: rows.filter((_, i) => WHOLESALE_STATUSES[i % WHOLESALE_STATUSES.length] === s)
        .length,
    })),
  ];

  return { rows, tabs, total: rows.length };
}

export function buildCustomersFixture(
  dict: Dictionary,
  locale: string
): { rows: CustomersListRow[]; tabs: CustomersListTab[]; total: number } {
  const u = dict.adminUi;
  const loc = (locale === "en" ? "en" : "ar") as Locale;

  const rows: CustomersListRow[] = CUSTOMER_NAMES.map((name, i) => ({
    id: `fix-cust-${i}`,
    name,
    phoneMasked: MASKS[i % MASKS.length]!,
    requestCount: (i % 5) + 1,
    lastActivity: formatAdminDate(new Date(Date.now() - 86_400_000), loc),
    lastReference: i % 4 === 0 ? null : `RO-2026-${3700 + i}`,
    hasWa: i % 2 === 0,
    createdLabel: formatAdminDate("2026-10-10T12:00:00+03:00", loc, {
      forceAbsolute: true,
    }),
    href: `/admin/customers/fix-cust-${i}`,
  }));

  const withRequests = rows.filter((r) => r.requestCount > 0).length;
  const tabs: CustomersListTab[] = [
    { value: "all", label: u.filterAll, count: rows.length },
    {
      value: "with_requests",
      label: u.customersFilterWithRequests,
      count: withRequests,
    },
    {
      value: "no_requests",
      label: u.customersFilterNoRequests,
      count: rows.length - withRequests,
    },
  ];

  return { rows, tabs, total: rows.length };
}

export function buildBrokerageFixture(locale: string): {
  rows: BrokerageTableRow[];
  active: number;
} {
  const ar = locale === "ar";
  const statuses = [
    "SUBMITTED",
    "AWAITING_PAYMENT",
    "PAYMENT_CONFIRMED",
    "ACCEPTED",
    "QUOTE_SENT",
    "SHIPPED",
    "DELIVERED",
    "CLOSED",
  ];

  const refs = [
    "BR-2026-0088",
    "BR-2026-0084",
    "BR-2026-0081",
    "BR-2026-0077",
    "BR-2026-0073",
    "BR-2026-0069",
    "BR-2026-0065",
    "BR-2026-0061",
    "BR-2026-0058",
    "BR-2026-0054",
  ];

  const descriptions = [
    "كمنجة عود قديمة — دمشق",
    "دهن عود كمبودي — ٥٠ غ",
    "مجموعة مسك وبخور",
    "عود بورمي — فحص مطلوب",
    "مباخر نحاسية أثرية",
    "دهن زعفران وعنبر",
    "عود هندي — شحنة تجريبية",
    "بخور دمشقي فاخر",
    "عود ماليزي — وساطة كاملة",
    "مخزون جملة مختلط",
  ];

  const now = Date.now();
  const rows: BrokerageTableRow[] = refs.map((reference, i) => ({
    id: `fix-br-${i}`,
    reference,
    traderName: TRADER_NAMES[i % TRADER_NAMES.length]!,
    description: descriptions[i % descriptions.length]!,
    createdAt: new Date(now - (i + 1) * 86_400_000),
    status: statuses[i % statuses.length]!,
    href: `/admin/brokerage/fix-br-${i}`,
  }));

  const active = rows.filter((r) => r.status !== "CLOSED").length;
  return { rows, active };
}
