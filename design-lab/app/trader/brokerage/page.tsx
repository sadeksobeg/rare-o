"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { brokerageRequests, brokerageStatusMeta, currentTrader } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { traderBrokerageDict } from "@/lib/dictionaries";

const statusBadgeClass: Record<string, string> = {
  neutral: "bg-ro-sand-300 text-ro-ink-700",
  info: "bg-ro-plum-100 text-ro-plum-900",
  progress: "bg-[#D9E6EE] text-[#1F3F57]",
  attention: "bg-ro-amber-100 text-ro-amber-800",
  success: "bg-[#DCEBDD] text-[#1F5130]",
  danger: "bg-[#F4DADC] text-[#8A2433]",
  closed: "bg-[#E6E0EA] text-ro-ink-500",
};

export default function TraderBrokeragePage() {
  const { locale } = useLocale();
  const t = useDict(traderBrokerageDict);
  const mine = brokerageRequests.filter((r) => r.traderId === currentTrader.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("pageTitle")}</h1>
          <p className="text-small text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/trader/brokerage/new">
            <Plus className="size-4" strokeWidth={1.5} />
            {t("newRequest")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">
            {t("pageTitle")} ({mine.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("pageTitle")}>
          {mine.length === 0 ? (
            <p className="py-8 text-center text-small text-muted-foreground">{t("noRequests")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colReference")}</TableHead>
                  <TableHead>{t("colItem")}</TableHead>
                  <TableHead>{t("colCity")}</TableHead>
                  <TableHead>{t("colSubmitted")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((r) => {
                  const meta = brokerageStatusMeta[r.status];
                  const awaitingTrader = r.status === "QUOTE_SENT" || r.status === "NEEDS_INFO";
                  return (
                    <TableRow key={r.id} className="cursor-pointer">
                      <TableCell className="font-mono text-caption" dir="ltr">
                        <Link href={`/trader/brokerage/${r.id}`} className="block hover:underline">
                          {r.id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-64 truncate">{locale === "ar" ? r.descriptionAr : r.descriptionEn}</TableCell>
                      <TableCell>{locale === "ar" ? r.city : r.cityEn}</TableCell>
                      <TableCell className="tabular-nums">{r.submittedDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={statusBadgeClass[meta.tone]}>
                            {locale === "ar" ? meta.ar : meta.en}
                          </Badge>
                          {awaitingTrader && (
                            <span className="relative inline-flex size-2 rounded-full bg-ro-amber-500">
                              <span className="absolute inset-0 animate-ping rounded-full bg-ro-amber-500" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
