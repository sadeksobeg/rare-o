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
import { toast } from "sonner";

export default function TradersPage() {
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
      prev.map((t) => (t.id === disableTarget ? { ...t, status: t.status === "active" ? "disabled" : "active" } : t))
    );
    setDisableTarget(null);
    toast.success("تم تحديث حالة الحساب");
  }

  function copyPassword() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const resetTraderName = traders.find((t) => t.id === resetTarget)?.name;
  const disableTraderName = traders.find((t) => t.id === disableTarget)?.name;
  const disableTraderStatus = traders.find((t) => t.id === disableTarget)?.status;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">التجّار</h1>
        <p className="text-small text-muted-foreground">إدارة حسابات التجّار — كلمة مرور أي تاجر لا تُعرض لأحد، يمكن فقط إعادة تعيينها</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">كل التجّار ({traders.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاجر</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>الصفقات</TableHead>
                <TableHead>نسبة القبول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="sr-only">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traders.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-caption text-muted-foreground" dir="ltr">
                      {t.email}
                    </div>
                  </TableCell>
                  <TableCell>{t.city}</TableCell>
                  <TableCell className="tabular-nums">{t.dealsCount}</TableCell>
                  <TableCell className="tabular-nums">{t.acceptRate}%</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "active" ? "secondary" : "outline"} className={t.status === "active" ? "bg-[#DCEBDD] text-[#1F5130]" : "bg-[#F4DADC] text-[#8A2433]"}>
                      {t.status === "active" ? "نشِط" : "معطَّل"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="المزيد">
                          <MoreHorizontal className="size-4" strokeWidth={1.5} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setResetTarget(t.id)}>
                          <KeyRound className="size-4" strokeWidth={1.5} /> إعادة تعيين كلمة المرور
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDisableTarget(t.id)}>
                          <ShieldAlert className="size-4" strokeWidth={1.5} />
                          {t.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}
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
            <AlertDialogTitle>إعادة تعيين كلمة مرور {resetTraderName}؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستُنشأ كلمة مرور مؤقتة جديدة وتظهر لك مرة واحدة فقط. كلمة مرور التاجر الحالية لن تكون مرئية لك في أي وقت؛ سيُطلب منه تغييرها فور الدخول.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>إعادة التعيين</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* show-once temp password */}
      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>كلمة المرور المؤقتة</DialogTitle>
            <DialogDescription>
              انسخها وسلّمها للتاجر الآن — لن تظهر مرة أخرى. سيُطالَب بتغييرها عند أول تسجيل دخول.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3">
            <code dir="ltr" className="flex-1 font-mono text-small tracking-wide">
              {tempPassword}
            </code>
            <Button type="button" variant="outline" size="icon" onClick={copyPassword} aria-label="نسخ">
              {copied ? <Check className="size-4" strokeWidth={1.5} /> : <Copy className="size-4" strokeWidth={1.5} />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setTempPassword(null)}>تم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* confirm disable/enable */}
      <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disableTraderStatus === "active" ? `تعطيل حساب ${disableTraderName}؟` : `تفعيل حساب ${disableTraderName}؟`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disableTraderStatus === "active"
                ? "لن يتمكّن التاجر من الدخول أو اقتراح صفقات جديدة حتى يُعاد تفعيل حسابه. الصفقات القائمة تبقى كما هي."
                : "سيستعيد التاجر القدرة على الدخول واقتراح صفقات جديدة."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>
              {disableTraderStatus === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
