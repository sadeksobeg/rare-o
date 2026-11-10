"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Plus, CircleDot, CircleAlert, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { kpis, requestsOverTime, domainSplit, retailRequests, type StatusTone } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { dashboardDict } from "@/lib/dictionaries";

const areaConfig = { requests: { label: "Requests", color: "var(--color-ro-plum-700)" } } satisfies ChartConfig;

const statusMeta: Record<StatusTone, { className: string; icon: typeof CircleDot }> = {
  neutral: { className: "bg-ro-sand-300 text-ro-ink-700", icon: CircleDot },
  info: { className: "bg-ro-plum-100 text-ro-plum-900", icon: CircleDot },
  progress: { className: "bg-[#D9E6EE] text-[#1F3F57]", icon: CircleDot },
  attention: { className: "bg-ro-amber-100 text-ro-amber-800", icon: CircleAlert },
  success: { className: "bg-[#DCEBDD] text-[#1F5130]", icon: CheckCircle2 },
  danger: { className: "bg-[#F4DADC] text-[#8A2433]", icon: CircleAlert },
  closed: { className: "bg-[#E6E0EA] text-ro-ink-500", icon: CircleDot },
};

function KpiCard({
  href,
  label,
  value,
  deltaLabel,
  trend,
}: {
  href?: string;
  label: string;
  value: number;
  deltaLabel: string;
  trend: "up" | "down";
}) {
  const body = (
    <>
      <p className="mb-1 text-small text-muted-foreground">{label}</p>
      <p className="text-h2 font-bold tabular-nums">
        <NumberTicker value={value} />
      </p>
      <div className="mt-2 flex items-center justify-between text-caption">
        <span className={`flex items-center gap-1 font-semibold ${trend === "up" ? "text-[#1F5130]" : "text-[#8A2433]"}`}>
          {trend === "up" ? <TrendingUp className="size-4" strokeWidth={1.5} /> : <TrendingDown className="size-4" strokeWidth={1.5} />}
          {deltaLabel}
        </span>
      </div>
    </>
  );
  if (!href) {
    return <div className="border-s-2 border-transparent ps-4">{body}</div>;
  }
  return (
    <Link href={href} className="group block border-s-2 border-transparent ps-4 transition-colors hover:border-ro-plum-300">
      {body}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { locale } = useLocale();
  const t = useDict(dashboardDict);
  const areaData = requestsOverTime.map((v, i) => ({ day: i + 1, requests: v }));
  const donutConfig = Object.fromEntries(
    domainSplit.map((d) => [locale === "ar" ? d.labelAr : d.labelEn, { label: locale === "ar" ? d.labelAr : d.labelEn, color: d.color }])
  ) satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* gradient-mesh header band */}
      <div className="relative overflow-hidden rounded-xl bg-ro-ink-950 p-6 text-ro-sand-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(42%_70%_at_12%_20%,rgba(82,39,124,.5),transparent_60%),radial-gradient(38%_60%_at_88%_85%,rgba(184,134,63,.22),transparent_62%)]" />
        <img src="/brand/logo-mark.svg" alt="" className="pointer-events-none absolute end-[-40px] top-1/2 h-56 w-56 -translate-y-1/2 opacity-10 invert" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-small text-ro-ink-200">
              <span className="relative inline-flex size-2 rounded-full bg-[#2f6b4f]">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#2f6b4f]" />
              </span>
              {t("whatsappConnected")}
            </p>
          </div>
          <Button className="bg-ro-sand-100 text-ro-ink-950 hover:bg-ro-sand-50">
            <Plus className="size-4" strokeWidth={1.5} />
            {t("addProduct")}
          </Button>
        </div>
      </div>

      {/* KPI row — only brokerage list exists in this lab build */}
      <div className="grid grid-cols-2 gap-4 border-b border-border pb-6 lg:grid-cols-4">
        <KpiCard label={t("kpiNewRetail")} value={kpis.newRetailRequests} deltaLabel={locale === "ar" ? "+12% أسبوعياً" : "+12% weekly"} trend="up" />
        <KpiCard label={t("kpiDealsAwaiting")} value={kpis.dealsAwaitingReply} deltaLabel={locale === "ar" ? "-3% أسبوعياً" : "-3% weekly"} trend="down" />
        <KpiCard label={t("kpiWholesale")} value={kpis.wholesaleRequests} deltaLabel={locale === "ar" ? "+2 هذا الأسبوع" : "+2 this week"} trend="up" />
        <KpiCard href="/admin/brokerage" label={t("kpiBrokerage")} value={kpis.activeBrokerageRequests} deltaLabel={locale === "ar" ? "+1 هذا الأسبوع" : "+1 this week"} trend="up" />
      </div>

      {/* charts row */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-h3">{t("requestsOverDays")}</CardTitle>
            <span className="text-caption text-muted-foreground">{t("total")} {requestsOverTime.reduce((a, b) => a + b, 0)}</span>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaConfig} className="h-[180px] w-full">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-ro-plum-300)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-ro-plum-300)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeOpacity={0.15} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="requests" type="monotone" stroke="var(--color-ro-plum-700)" fill="url(#fillRequests)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">{t("domainSplit")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <ChartContainer config={donutConfig} className="aspect-square h-[140px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={domainSplit} dataKey="value" nameKey={locale === "ar" ? "labelAr" : "labelEn"} innerRadius={38} outerRadius={60} strokeWidth={0}>
                  {domainSplit.map((entry) => (
                    <Cell key={entry.labelAr} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="space-y-1.5 text-small">
              {domainSplit.map((d) => (
                <li key={d.labelAr} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                  {locale === "ar" ? d.labelAr : d.labelEn}
                  <span className="text-muted-foreground">{d.value}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* action queue */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-h3">{t("awaitingAction")}</CardTitle>
          <Link href="/admin/brokerage" className="text-caption text-ro-plum-900 underline underline-offset-2">
            {t("viewAll")}
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("awaitingAction")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colReference")}</TableHead>
                <TableHead>{t("colCustomer")}</TableHead>
                <TableHead>{t("colItems")}</TableHead>
                <TableHead>{t("colDate")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retailRequests.slice(0, 3).map((r) => {
                const meta = statusMeta[r.status];
                const Icon = meta.icon;
                const customerName = locale === "ar" ? r.customerAr : r.customerEn;
                return (
                  <TableRow key={r.id} className="cursor-pointer">
                    <TableCell className="font-mono text-caption" dir="ltr">
                      {r.id}
                    </TableCell>
                    <TableCell dir={r.customerAr === r.customerEn ? "ltr" : undefined}>{customerName}</TableCell>
                    <TableCell>{r.items}</TableCell>
                    <TableCell className="tabular-nums">{r.date}</TableCell>
                    <TableCell>
                      <Badge className={meta.className} variant="secondary">
                        <Icon className="size-4" strokeWidth={1.5} />
                        {locale === "ar" ? r.statusLabelAr : r.statusLabelEn}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
