"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { brokerageRequests, brokerageStatusMeta, traders } from "@/lib/fixtures";
import { useLocale, useDict } from "@/lib/i18n";
import { adminBrokerageDict } from "@/lib/dictionaries";
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

export function AdminBrokerageDetail({ id }: { id: string }) {
  const { locale } = useLocale();
  const t = useDict(adminBrokerageDict);
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const [declineOpen, setDeclineOpen] = useState(false);

  const request = brokerageRequests.find((r) => r.id === id);
  if (!request) notFound();
  const trader = traders.find((tr) => tr.id === request.traderId);
  const meta = brokerageStatusMeta[request.status];

  const [goodsValue, setGoodsValue] = useState(request.quote?.goodsValue ?? 2000);
  const [commissionRate, setCommissionRate] = useState([request.quote?.commissionRate ?? 1.5]);
  const [shippingCost, setShippingCost] = useState(request.quote?.shipping ?? 50);
  const commissionAmount = useMemo(() => Math.round((goodsValue * commissionRate[0]) / 100), [goodsValue, commissionRate]);
  const totalForTrader = goodsValue + commissionAmount + shippingCost;

  function decline() {
    setDeclineOpen(false);
    toast.success("تم رفض الطلب");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/brokerage" className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground">
        <BackIcon className="size-4" strokeWidth={1.5} />
        {t("backToBoard")}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-h3">{t("detailTrader")}</CardTitle>
          </CardHeader>
          <CardContent className="text-small">
            {trader && (
              <>
                <p className="font-medium">{locale === "ar" ? trader.name : trader.nameEn}</p>
                <p className="text-muted-foreground" dir="ltr">
                  {trader.email}
                </p>
                <p className="mt-2 text-caption text-muted-foreground">
                  {trader.dealsCount} {locale === "ar" ? "صفقة سابقة" : "prior deals"} · {trader.acceptRate}% {locale === "ar" ? "قبول" : "acceptance"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6 text-small">
            <p>
              <span className="text-caption text-muted-foreground">{t("colCity")}: </span>
              {locale === "ar" ? request.city : request.cityEn}
            </p>
            <p>
              <span className="text-caption text-muted-foreground">{locale === "ar" ? "المكان" : "Place"}: </span>
              {locale === "ar" ? request.placeName : request.placeNameEn}
            </p>
            <p dir="ltr" className="text-end sm:text-start">
              <span className="text-caption text-muted-foreground">{locale === "ar" ? "الميزانية: " : "Budget: "}</span>$
              {request.budgetMin}–${request.budgetMax}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">{t("scheduleInspection")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="inspection-date">{t("inspectionDate")}</Label>
            <Input id="inspection-date" type="date" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assignee">{t("assignee")}</Label>
            <Select defaultValue="samer">
              <SelectTrigger id="assignee" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="samer">سامر الحلبي</SelectItem>
                <SelectItem value="hala">هالة نصر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">{t("location")}</Label>
            <Input id="location" defaultValue={locale === "ar" ? request.placeName : request.placeNameEn} />
          </div>
          <div className="sm:col-span-3">
            <Button size="sm" onClick={() => toast.success(t("confirmSchedule"))}>
              {t("confirmSchedule")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">{t("inspectionReportBuilder")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border border-dashed p-6 text-center text-caption text-muted-foreground">
            <ImageIcon className="mx-auto size-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grade">{t("grade")}</Label>
            <Select defaultValue={request.inspection?.grade ?? "B"}>
              <SelectTrigger id="grade" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">{t("gradeA")}</SelectItem>
                <SelectItem value="B">{t("gradeB")}</SelectItem>
                <SelectItem value="C">{t("gradeC")}</SelectItem>
                <SelectItem value="D">{t("gradeD")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("checklist")}</Label>
            {["checklistStructure", "checklistSound", "checklistOriginal", "checklistDocs"].map((key) => (
              <label key={key} className="flex items-center gap-2 text-small">
                <Checkbox defaultChecked />
                {t(key as keyof typeof adminBrokerageDict)}
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inspection-notes">{t("notes")}</Label>
            <Textarea id="inspection-notes" rows={3} defaultValue={request.inspection ? (locale === "ar" ? request.inspection.notes : request.inspection.notesEn) : ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="verdict">{t("verdict")}</Label>
            <Input id="verdict" defaultValue={request.inspection ? (locale === "ar" ? request.inspection.verdict : request.inspection.verdictEn) : ""} />
          </div>
          <Button size="sm" onClick={() => toast.success(t("reportSaved"))}>
            {t("saveReport")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">{t("quoteBuilder")}</CardTitle>
          <CardDescription>{locale === "ar" ? "العمولة بين 1% و2% من قيمة القطعة" : "Commission is between 1% and 2% of the goods value"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="goods-value">{t("goodsValue")}</Label>
            <Input id="goods-value" type="number" dir="ltr" value={goodsValue} onChange={(e) => setGoodsValue(Number(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("commissionRate")}</Label>
              <span className="text-small font-medium tabular-nums" dir="ltr">
                {commissionRate[0].toFixed(1)}%
              </span>
            </div>
            <Slider min={1} max={2} step={0.1} value={commissionRate} onValueChange={setCommissionRate} />
            <p className="text-caption text-muted-foreground">
              {t("commissionAmount")}: <span className="tabular-nums" dir="ltr">${commissionAmount.toLocaleString("en-US")}</span>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipping-cost">{t("shippingCost")}</Label>
            <Input id="shipping-cost" type="number" dir="ltr" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value) || 0)} />
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/40 p-3 text-base font-semibold">
            <span>{t("totalForTrader")}</span>
            <span dir="ltr" className="tabular-nums">
              ${totalForTrader.toLocaleString("en-US")}
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validity">{t("quoteValidity")}</Label>
            <Input id="validity" type="date" dir="ltr" defaultValue={request.quote?.validUntil} />
          </div>
          <Button onClick={() => toast.success(t("quoteSent"))}>{t("sendQuote")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">{t("purchaseShipping")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="carrier">{t("carrier")}</Label>
            <Input id="carrier" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tracking">{t("trackingRef")}</Label>
            <Input id="tracking" dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <Button variant="outline" size="sm" onClick={() => toast.success(t("markPurchased"))}>
              {t("markPurchased")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button variant="ghost" className="text-[#8A2433] hover:text-[#8A2433]" onClick={() => setDeclineOpen(true)}>
        {t("declineRequest")}
      </Button>

      <AlertDialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("declineConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("declineConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={decline}>{t("declineRequest")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
