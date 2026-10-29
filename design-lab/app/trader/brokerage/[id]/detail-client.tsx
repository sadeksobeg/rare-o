"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { brokerageRequests, brokerageStatusMeta, brokerageLifecycleOrder } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { traderBrokerageDict } from "@/lib/dictionaries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusBadgeClass: Record<string, string> = {
  neutral: "bg-ro-sand-300 text-ro-ink-700",
  info: "bg-ro-plum-100 text-ro-plum-900",
  progress: "bg-[#D9E6EE] text-[#1F3F57]",
  attention: "bg-ro-amber-100 text-ro-amber-800",
  success: "bg-[#DCEBDD] text-[#1F5130]",
  danger: "bg-[#F4DADC] text-[#8A2433]",
  closed: "bg-[#E6E0EA] text-ro-ink-500",
};

export function TraderBrokerageDetail({ id }: { id: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = useDict(traderBrokerageDict);
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const [approveOpen, setApproveOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  const request = brokerageRequests.find((r) => r.id === id);
  if (!request) notFound();

  const meta = brokerageStatusMeta[request.status];
  const currentStepIndex = brokerageLifecycleOrder.indexOf(request.status);
  const isTerminalRejected = ["DECLINED", "REJECTED", "CANCELLED"].includes(request.status);

  function approve() {
    setApproveOpen(false);
    toast.success(t("quoteApproved"));
  }
  function decline() {
    setDeclineOpen(false);
    toast.success(t("quoteDeclined"));
    router.push("/trader/brokerage");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/trader/brokerage" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground">
        <BackIcon className="size-4" strokeWidth={1.5} />
        {t("backToList")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-h2 font-semibold" dir="ltr">
            {request.id}
          </h1>
          <p className="mt-1 max-w-md text-small text-muted-foreground">{locale === "ar" ? request.descriptionAr : request.descriptionEn}</p>
        </div>
        <Badge variant="secondary" className={statusBadgeClass[meta.tone]}>
          {locale === "ar" ? meta.ar : meta.en}
        </Badge>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 text-small sm:grid-cols-2">
          <div>
            <p className="text-caption text-muted-foreground">{t("city")}</p>
            <p>{locale === "ar" ? request.city : request.cityEn}</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground">{t("placeName")}</p>
            <p>{locale === "ar" ? request.placeName : request.placeNameEn}</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground">{t("category")}</p>
            <p>{locale === "ar" ? request.category : request.categoryEn}</p>
          </div>
          <div>
            <p className="text-caption text-muted-foreground">{t("detailBudget")}</p>
            <p dir="ltr" className="text-end sm:text-start">
              ${request.budgetMin} – ${request.budgetMax}
            </p>
          </div>
        </CardContent>
      </Card>

      {!isTerminalRejected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">{t("journeyTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-0">
              {brokerageLifecycleOrder.map((status, i) => {
                const stepMeta = brokerageStatusMeta[status];
                const done = i < currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <li key={status} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-caption",
                          done ? "bg-ro-plum-700 text-ro-sand-50" : active ? "bg-ro-ink-950 text-ro-sand-50" : "bg-ro-sand-300 text-ro-ink-500"
                        )}
                      >
                        {done ? <Check className="size-3.5" strokeWidth={2} /> : i + 1}
                      </div>
                      {i < brokerageLifecycleOrder.length - 1 && <div className={cn("my-1 h-6 w-px", done ? "bg-ro-plum-700" : "bg-border")} />}
                    </div>
                    <p className={cn("pt-0.5 text-small", active ? "font-semibold" : done ? "" : "text-muted-foreground")}>
                      {locale === "ar" ? stepMeta.ar : stepMeta.en}
                    </p>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {isTerminalRejected && "declineReason" in request && (
        <Card>
          <CardContent className="pt-6 text-small">
            <p className="text-caption text-muted-foreground">{t("declinedReason")}</p>
            <p>{locale === "ar" ? request.declineReason : request.declineReasonEn}</p>
          </CardContent>
        </Card>
      )}

      {request.inspection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">{t("inspectionReport")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-small">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-caption text-muted-foreground">{t("grade")}</p>
                <p className="text-h3 font-semibold">{request.inspection.grade}</p>
              </div>
              <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                <ImageIcon className="size-4" strokeWidth={1.5} />
                {request.inspection.photos} {t("photosCount")}
              </div>
            </div>
            <div>
              <p className="text-caption text-muted-foreground">{t("inspectionNotes")}</p>
              <p>{locale === "ar" ? request.inspection.notes : request.inspection.notesEn}</p>
            </div>
            <div>
              <p className="text-caption text-muted-foreground">{t("verdict")}</p>
              <p className="font-medium text-[#1F5130]">{locale === "ar" ? request.inspection.verdict : request.inspection.verdictEn}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {request.quote && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">{t("quoteTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-small">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("goodsValue")}</span>
              <span dir="ltr" className="tabular-nums">
                ${request.quote.goodsValue.toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("commission")} ({request.quote.commissionRate}%)
              </span>
              <span dir="ltr" className="tabular-nums">
                ${Math.round((request.quote.goodsValue * request.quote.commissionRate) / 100).toLocaleString("en-US")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("shipping")}</span>
              <span dir="ltr" className="tabular-nums">
                ${request.quote.shipping}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
              <span>{t("total")}</span>
              <span dir="ltr" className="tabular-nums">
                ${(request.quote.goodsValue + Math.round((request.quote.goodsValue * request.quote.commissionRate) / 100) + request.quote.shipping).toLocaleString("en-US")}
              </span>
            </div>
            <p className="text-caption text-muted-foreground">
              {t("validUntil")}: <span className="tabular-nums">{request.quote.validUntil}</span>
            </p>

            {request.status === "QUOTE_SENT" && (
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => setApproveOpen(true)}>
                  {t("approve")}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setDeclineOpen(true)}>
                  {t("decline")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("approveConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("approveConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={approve}>{t("approve")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("declineConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("declineConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={decline}>{t("decline")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
