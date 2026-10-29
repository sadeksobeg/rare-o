"use client";

import { useState } from "react";
import { MoreHorizontal, Copy, Check, ShieldAlert, KeyRound } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { traders as initialTraders } from "@/lib/fixtures";
import { generateTempPassword } from "@/lib/temp-password";
import { useLocale, useDict } from "@/lib/i18n";
import { tradersDict } from "@/lib/dictionaries";
import { toast } from "sonner";

export default function TradersPage() {
  const { locale } = useLocale();
  const t = useDict(tradersDict);
  const [traders, setTraders] = useState(initialTraders);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [disableTarget, setDisableTarget] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function confirmReset() {
    const pw = generateTempPassword();
    setTempPassword(pw);
    setResetTarget(null);
  }

  function confirmDisable() {
    setTraders((prev) =>
      prev.map((tr) => (tr.id === disableTarget ? { ...tr, status: tr.status === "active" ? "disabled" : "active" } : tr))
    );
    setDisableTarget(null);
    toast.success(t("statusUpdated"));
  }

  function copyPassword() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const resetTrader = traders.find((tr) => tr.id === resetTarget);
  const disableTrader = traders.find((tr) => tr.id === disableTarget);
  const disableTraderName = disableTrader ? (locale === "ar" ? disableTrader.name : disableTrader.nameEn) : "";
  const disableTraderStatus = disableTrader?.status;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("pageTitle")}</h1>
        <p className="text-small text-muted-foreground">{t("pageSubtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">
            {t("allTraders")} ({traders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colTrader")}</TableHead>
                <TableHead>{t("colCity")}</TableHead>
                <TableHead>{t("colDeals")}</TableHead>
                <TableHead>{t("colAcceptRate")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead className="sr-only">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traders.map((tr) => (
                <TableRow key={tr.id}>
                  <TableCell>
                    <div className="font-medium">{locale === "ar" ? tr.name : tr.nameEn}</div>
                    <div className="text-caption text-muted-foreground" dir="ltr">
                      {tr.email}
                    </div>
                  </TableCell>
                  <TableCell>{locale === "ar" ? tr.city : tr.cityEn}</TableCell>
                  <TableCell className="tabular-nums">{tr.dealsCount}</TableCell>
                  <TableCell className="tabular-nums">{tr.acceptRate}%</TableCell>
                  <TableCell>
                    <Badge variant={tr.status === "active" ? "secondary" : "outline"} className={tr.status === "active" ? "bg-[#DCEBDD] text-[#1F5130]" : "bg-[#F4DADC] text-[#8A2433]"}>
                      {tr.status === "active" ? t("statusActive") : t("statusDisabled")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t("more")}>
                          <MoreHorizontal className="size-4" strokeWidth={1.5} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setResetTarget(tr.id)}>
                          <KeyRound className="size-4" strokeWidth={1.5} /> {t("resetPassword")}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDisableTarget(tr.id)}>
                          <ShieldAlert className="size-4" strokeWidth={1.5} />
                          {tr.status === "active" ? t("disableAccount") : t("enableAccount")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* confirm reset */}
      <AlertDialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("resetConfirmTitle")} {resetTrader ? (locale === "ar" ? resetTrader.name : resetTrader.nameEn) : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>{t("resetConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>{t("confirmReset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* show-once temp password */}
      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tempPasswordTitle")}</DialogTitle>
            <DialogDescription>{t("tempPasswordDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code dir="ltr" className="flex-1 font-mono text-small tracking-wide">
              {tempPassword}
            </code>
            <Button type="button" variant="outline" size="icon" onClick={copyPassword} aria-label={t("copy")}>
              {copied ? <Check className="size-4" strokeWidth={1.5} /> : <Copy className="size-4" strokeWidth={1.5} />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>{t("done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* confirm disable/enable */}
      <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disableTraderStatus === "active" ? t("disableConfirmTitleActive") : t("disableConfirmTitleDisabled")} {disableTraderName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disableTraderStatus === "active" ? t("disableConsequence") : t("enableConsequence")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>
              {disableTraderStatus === "active" ? t("disableAccount") : t("enableAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
