"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brokerageRequests, brokerageStatusMeta, brokerageLifecycleOrder, traders, type BrokerageStatus } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { adminBrokerageDict } from "@/lib/dictionaries";

const statusBadgeClass: Record<string, string> = {
  neutral: "bg-ro-sand-300 text-ro-ink-700",
  info: "bg-ro-plum-100 text-ro-plum-900",
  progress: "bg-[#D9E6EE] text-[#1F3F57]",
  attention: "bg-ro-amber-100 text-ro-amber-800",
  success: "bg-[#DCEBDD] text-[#1F5130]",
  danger: "bg-[#F4DADC] text-[#8A2433]",
  closed: "bg-[#E6E0EA] text-ro-ink-500",
};

const boardColumns: BrokerageStatus[] = ["SUBMITTED", "ACCEPTED", "INSPECTION_SCHEDULED", "INSPECTED", "QUOTE_SENT", "APPROVED"];

// A fixed reference "today" rather than Date.now(): this demo's fixture
// dates are static, and Next.js 16's Cache Components mode flags Date.now()
// read directly in a component body as non-deterministic prerender input
// (the same category of bug fixed earlier in admin-topbar.tsx's greeting).
const DEMO_TODAY = new Date("2026-10-29").getTime();

function daysAgo(dateStr: string) {
  const diff = DEMO_TODAY - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export default function AdminBrokeragePage() {
  const { locale } = useLocale();
  const t = useDict(adminBrokerageDict);
  const [view, setView] = useState<"board" | "table">("board");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("pageTitle")}</h1>
          <p className="text-small text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "table")}>
          <TabsList>
            <TabsTrigger value="board">
              <LayoutGrid className="size-4" strokeWidth={1.5} />
              {t("viewBoard")}
            </TabsTrigger>
            <TabsTrigger value="table">
              <List className="size-4" strokeWidth={1.5} />
              {t("viewTable")}
            </TabsTrigger>
          </TabsList>
          {/* The view toggle switches rendering below via `view` state, not
              TabsContent — these stay empty so TabsTrigger's aria-controls
              resolves to a real element (axe: aria-valid-attr-value). */}
          <TabsContent value="board" />
          <TabsContent value="table" />
        </Tabs>
      </div>

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-2" tabIndex={0} role="region" aria-label={t("viewBoard")}>
          {boardColumns.map((status) => {
            const meta = brokerageStatusMeta[status];
            const items = brokerageRequests.filter((r) => r.status === status);
            return (
              <div key={status} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-small font-medium">{locale === "ar" ? meta.ar : meta.en}</span>
                  <span className="text-caption text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((r) => {
                    const trader = traders.find((tr) => tr.id === r.traderId);
                    const age = daysAgo(r.submittedDate);
                    return (
                      <Link key={r.id} href={`/admin/brokerage/${r.id}`}>
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="space-y-1.5 pt-4">
                            <p className="font-mono text-caption text-muted-foreground" dir="ltr">
                              {r.id}
                            </p>
                            <p className="line-clamp-2 text-small">{locale === "ar" ? r.descriptionAr : r.descriptionEn}</p>
                            <div className="flex items-center justify-between text-caption text-muted-foreground">
                              <span>{trader ? (locale === "ar" ? trader.name : trader.nameEn) : "—"}</span>
                              <Badge variant="outline" className={age > 3 ? "border-ro-amber-500 text-ro-amber-800" : ""}>
                                {age} {t("daysOld")}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                  {items.length === 0 && <div className="rounded-md border border-dashed p-4 text-center text-caption text-muted-foreground">—</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">
              {t("pageTitle")} ({brokerageRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("pageTitle")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colReference")}</TableHead>
                  <TableHead>{t("colTrader")}</TableHead>
                  <TableHead>{t("colCity")}</TableHead>
                  <TableHead>{t("colAge")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brokerageRequests.map((r) => {
                  const meta = brokerageStatusMeta[r.status];
                  const trader = traders.find((tr) => tr.id === r.traderId);
                  return (
                    <TableRow key={r.id} className="cursor-pointer">
                      <TableCell className="font-mono text-caption" dir="ltr">
                        <Link href={`/admin/brokerage/${r.id}`} className="block hover:underline">
                          {r.id}
                        </Link>
                      </TableCell>
                      <TableCell>{trader ? (locale === "ar" ? trader.name : trader.nameEn) : "—"}</TableCell>
                      <TableCell>{locale === "ar" ? r.city : r.cityEn}</TableCell>
                      <TableCell className="tabular-nums">
                        {daysAgo(r.submittedDate)} {t("daysOld")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusBadgeClass[meta.tone]}>
                          {locale === "ar" ? meta.ar : meta.en}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
