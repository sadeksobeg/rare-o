"use client";

import { useMemo, useState } from "react";
import { Laptop, Smartphone, ShieldCheck, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { currentAdmin } from "@/lib/fixtures";
import { toast } from "sonner";

const sessions = [
  { id: "s1", device: "MacBook Pro — Chrome", city: "دمشق، سوريا", current: true, icon: Laptop },
  { id: "s2", device: "iPhone 15 — تطبيق RARE OUD", city: "دمشق، سوريا", current: false, icon: Smartphone },
];

function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const scoreMeta = [
  { labelAr: "ضعيفة", color: "bg-[#8A2433]" },
  { labelAr: "مقبولة", color: "bg-ro-amber-500" },
  { labelAr: "جيدة", color: "bg-ro-amber-500" },
  { labelAr: "قوية", color: "bg-[#1F5130]" },
  { labelAr: "قوية جداً", color: "bg-[#1F5130]" },
];

export default function AdminProfilePage() {
  const [newPassword, setNewPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const score = useMemo(() => passwordScore(newPassword), [newPassword]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-heading)]">حسابي</h1>
        <p className="text-sm text-muted-foreground">إدارة بياناتك الشخصية وإعدادات الأمان</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="sessions">الجلسات النشطة</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">البيانات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback className="bg-ro-plum-100 text-base text-ro-plum-900">
                    {currentAdmin.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  تغيير الصورة
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">الاسم</Label>
                  <Input id="name" defaultValue={currentAdmin.name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" dir="ltr" defaultValue={currentAdmin.email} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">الهاتف</Label>
                  <Input id="phone" dir="ltr" placeholder="+963 9xx xxx xxx" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lang">اللغة</Label>
                  <Select defaultValue="ar">
                    <SelectTrigger id="lang" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="theme">المظهر</Label>
                  <Select defaultValue="system">
                    <SelectTrigger id="theme" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">فاتح</SelectItem>
                      <SelectItem value="dark">داكن</SelectItem>
                      <SelectItem value="system">حسب النظام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success("تم حفظ البيانات")}>حفظ التغييرات</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تغيير كلمة المرور</CardTitle>
              <CardDescription>استخدم كلمة مرور لا تستخدمها في أي مكان آخر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pw">كلمة المرور الحالية</Label>
                <Input id="current-pw" type="password" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pw">كلمة المرور الجديدة</Label>
                <Input
                  id="new-pw"
                  type="password"
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {newPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Progress value={(score / 4) * 100} className={`h-1.5 [&>div]:${scoreMeta[score].color}`} />
                    <p className="text-xs text-muted-foreground">قوة كلمة المرور: {scoreMeta[score].labelAr}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={newPassword.length < 8}
                  onClick={() => {
                    setNewPassword("");
                    toast.success("تم تغيير كلمة المرور");
                  }}
                >
                  تحديث كلمة المرور
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">التحقق بخطوتين</CardTitle>
                <CardDescription>طبقة حماية إضافية عند تسجيل الدخول</CardDescription>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} aria-label="تفعيل التحقق بخطوتين" />
            </CardHeader>
            {twoFactor && (
              <CardContent>
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-4 text-sm">
                  <ShieldCheck className="size-5 shrink-0 text-[#1F5130]" strokeWidth={1.5} />
                  <p>
                    امسح رمز QR من تطبيق المصادقة الخاص بك، ثم أدخل الرمز المكوّن من 6 أرقام لإتمام
                    التفعيل. سيُطلب هذا الرمز في كل تسجيل دخول جديد.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">الجلسات النشطة</CardTitle>
                <CardDescription>الأجهزة المسجَّلة بحسابك حالياً</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSignOutOpen(true)}>
                <LogOut className="size-4" strokeWidth={1.5} />
                تسجيل الخروج من الجلسات الأخرى
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {sessions.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className={`flex items-center justify-between gap-3 py-3 ${i === 0 ? "pt-0" : ""}`}>
                      <div className="flex items-center gap-3">
                        <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                        <div>
                          <div className="text-sm font-medium" dir="ltr">
                            {s.device}
                          </div>
                          <div className="text-xs text-muted-foreground">{s.city}</div>
                        </div>
                      </div>
                      {s.current && (
                        <span className="text-xs font-medium text-[#1F5130]">الجلسة الحالية</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تسجيل الخروج من كل الجلسات الأخرى؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستحتاج كل الأجهزة الأخرى إلى تسجيل الدخول مجدداً. هذه الجلسة الحالية تبقى متصلة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSignOutOpen(false);
                toast.success("تم تسجيل الخروج من الجلسات الأخرى");
              }}
            >
              تسجيل الخروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
