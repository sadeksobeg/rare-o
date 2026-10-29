"use client";

import { useState } from "react";
import { MoreHorizontal, UserPlus, ShieldCheck, Shield, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teamMembers as initialTeam } from "@/lib/fixtures";
import { toast } from "sonner";

type Role = "Owner" | "Manager" | "Staff";

const roleLabelAr: Record<Role, string> = { Owner: "مالك", Manager: "مدير", Staff: "موظف" };
const roleIcon: Record<Role, typeof ShieldCheck> = { Owner: ShieldCheck, Manager: Shield, Staff: UserCog };

const permissions: { labelAr: string; owner: boolean; manager: boolean; staff: boolean }[] = [
  { labelAr: "عرض لوحة التحكم والتقارير", owner: true, manager: true, staff: true },
  { labelAr: "إدارة الطلبات والصفقات", owner: true, manager: true, staff: true },
  { labelAr: "إدارة المنتجات والكتالوج", owner: true, manager: true, staff: false },
  { labelAr: "إدارة حسابات التجّار", owner: true, manager: true, staff: false },
  { labelAr: "دعوة أعضاء الفريق وتغيير الأدوار", owner: true, manager: false, staff: false },
  { labelAr: "الوصول إلى سجلّ الأمان", owner: true, manager: true, staff: false },
];

export default function TeamPage() {
  const [team, setTeam] = useState(initialTeam);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState<string | null>(null);
  const disableMember = team.find((m) => m.id === disableTarget);

  function sendInvite() {
    setInviteOpen(false);
    toast.success("أُرسلت الدعوة بالبريد الإلكتروني");
  }

  function confirmDisable() {
    setTeam((prev) =>
      prev.map((m) => (m.id === disableTarget ? { ...m, status: m.status === "active" ? "disabled" : "active" } : m))
    );
    setDisableTarget(null);
    toast.success("تم تحديث حالة العضو");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold font-[family-name:var(--font-heading)]">الفريق</h1>
          <p className="text-sm text-muted-foreground">أعضاء فريق الإدارة وصلاحياتهم</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" strokeWidth={1.5} />
          دعوة عضو
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الأعضاء ({team.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العضو</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>آخر نشاط</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="sr-only">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((m) => {
                const RoleIcon = roleIcon[m.role];
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-ro-plum-100 text-ro-plum-900">
                            {m.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground" dir="ltr">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <RoleIcon className="size-4 text-muted-foreground" strokeWidth={1.5} />
                        {roleLabelAr[m.role]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.lastActive}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={m.status === "active" ? "bg-[#DCEBDD] text-[#1F5130]" : "bg-[#F4DADC] text-[#8A2433]"}
                      >
                        {m.status === "active" ? "نشِط" : "معطَّل"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.role !== "Owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="المزيد">
                              <MoreHorizontal className="size-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant={m.status === "active" ? "destructive" : "default"}
                              onClick={() => setDisableTarget(m.id)}
                            >
                              {m.status === "active" ? "تعطيل العضوية" : "تفعيل العضوية"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">الصلاحيات حسب الدور</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصلاحية</TableHead>
                <TableHead className="text-center">مالك</TableHead>
                <TableHead className="text-center">مدير</TableHead>
                <TableHead className="text-center">موظف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((p) => (
                <TableRow key={p.labelAr}>
                  <TableCell>{p.labelAr}</TableCell>
                  <TableCell className="text-center">{p.owner ? <ShieldCheck className="mx-auto size-4 text-[#1F5130]" strokeWidth={1.5} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-center">{p.manager ? <ShieldCheck className="mx-auto size-4 text-[#1F5130]" strokeWidth={1.5} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-center">{p.staff ? <ShieldCheck className="mx-auto size-4 text-[#1F5130]" strokeWidth={1.5} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>دعوة عضو جديد</DialogTitle>
            <DialogDescription>سيصل بريد إلكتروني يحتوي رابط دعوة صالحاً لمدة 7 أيام.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">البريد الإلكتروني</Label>
              <Input id="invite-email" type="email" dir="ltr" placeholder="name@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">الدور</Label>
              <Select defaultValue="Staff">
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">مدير</SelectItem>
                  <SelectItem value="Staff">موظف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={sendInvite}>إرسال الدعوة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disableMember?.status === "active" ? `تعطيل عضوية ${disableMember?.name}؟` : `تفعيل عضوية ${disableMember?.name}؟`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disableMember?.status === "active"
                ? "لن يتمكّن من الدخول إلى لوحة التحكم حتى تُعاد عضويته."
                : "سيستعيد القدرة على الدخول إلى لوحة التحكم بدوره الحالي."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
