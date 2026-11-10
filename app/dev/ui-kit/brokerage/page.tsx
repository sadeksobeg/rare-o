import { Suspense } from "react";
import { BrokerageAdminFilters } from "@/components/admin/brokerage-filters";
import { BrokerageTable } from "@/components/admin/rad/brokerage-table";
import { Card, CardHeader } from "@/components/ui-kit";
import { buildBrokerageFixture } from "@/lib/dev/ui-kit-fixtures";
import { getRequestDictionary } from "@/lib/i18n/server";

export default async function DevUiKitBrokeragePage() {
  const { locale, dict } = await getRequestDictionary();
  const ar = locale === "ar";
  const u = dict.adminUi;
  const { rows, active } = buildBrokerageFixture(locale);
  const stale = 2;

  return (
    <section data-admin-brokerage="" className="space-y-5 pb-16">
      <header className="rad-phead">
        <div>
          <h1>{dict.admin.brokerage}</h1>
          <p>
            {ar
              ? "من استقبال الطلب حتى الإغلاق — بيانات عرض ثابتة"
              : "Intake to close — static fixture data"}
            {" · "}
            <span className="tabular-nums">
              {active} {ar ? "نشط" : "active"} · 3 {ar ? "للإدارة" : "admin"} · 2{" "}
              {ar ? "للتاجر" : "trader"}
              {stale > 0 ? ` · ${stale} ${ar ? "متأخر" : "stale"}` : ""}
            </span>
          </p>
        </div>
      </header>

      <Suspense fallback={null}>
        <BrokerageAdminFilters
          tabsLabel={u.filterTabs}
          allLabel={u.filterAll}
          allCount={rows.length}
          staleLabel={ar ? "متأخر فقط" : "Stale only"}
          staleCount={stale}
          traderLabel={ar ? "تاجر" : "Trader"}
          cityLabel={ar ? "مدينة" : "City"}
          searchLabel={u.search}
          clearLabel={dict.catalog.clearFilters}
          resultCount={rows.length}
          resultLabel={u.resultsLabel}
        />
      </Suspense>

      <Card padded={false} className="overflow-hidden">
        <CardHeader
          title={ar ? "كل الطلبات" : "All requests"}
          count={rows.length}
        />
        <BrokerageTable
          locale={locale}
          rows={rows}
          labels={{
            colReference: ar ? "المرجع" : "Ref",
            colTrader: ar ? "التاجر" : "Trader",
            colDescription: ar ? "الوصف" : "Description",
            colAge: ar ? "العمر" : "Age",
            colWaiting: ar ? "ينتظر" : "Waiting",
            colStatus: ar ? "الحالة" : "Status",
            colNext: ar ? "الخطوة التالية" : "Next",
          }}
        />
      </Card>
    </section>
  );
}
