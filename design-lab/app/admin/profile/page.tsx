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
import { useLocale, useDict } from "@/lib/i18n";
import { profileDict } from "@/lib/dictionaries";
import { toast } from "sonner";

const sessions = [
  { id: "s1", deviceAr: "MacBook Pro — Chrome", deviceEn: "MacBook Pro — Chrome", cityAr: "دمشق، سوريا", cityEn: "Damascus, Syria", current: true, icon: Laptop },
  { id: "s2", deviceAr: "iPhone 15 — تطبيق RARE OUD", deviceEn: "iPhone 15 — RARE OUD App", cityAr: "دمشق، سوريا", cityEn: "Damascus, Syria", current: false, icon: Smartphone },
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

const scoreColor = ["bg-[#8A2433]", "bg-ro-amber-500", "bg-ro-amber-500", "bg-[#1F5130]", "bg-[#1F5130]"];
const scoreLabelKeys = ["strengthWeak", "strengthFair", "strengthGood", "strengthStrong", "strengthVeryStrong"] as const;

export default function AdminProfilePage() {
  const { locale } = useLocale();
  const t = useDict(profileDict);
  const [newPassword, setNewPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const score = useMemo(() => passwordScore(newPassword), [newPassword]);
  const name = locale === "ar" ? currentAdmin.name : currentAdmin.nameEn;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("pageTitle")}</h1>
        <p className="text-small text-muted-foreground">{t("pageSubtitle")}</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("tabProfile")}</TabsTrigger>
          <TabsTrigger value="security">{t("tabSecurity")}</TabsTrigger>
          <TabsTrigger value="sessions">{t("tabSessions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">{t("personalData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback className="bg-ro-plum-100 text-h3 text-ro-plum-900">
                    {name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  {t("changePhoto")}
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input id="name" defaultValue={name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input id="email" dir="ltr" defaultValue={currentAdmin.email} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input id="phone" dir="ltr" placeholder="+963 9xx xxx xxx" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lang">{t("language")}</Label>
                  <Select defaultValue="ar">
                    <SelectTrigger id="lang" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{t("arabic")}</SelectItem>
                      <SelectItem value="en">{t("english")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="theme">{t("theme")}</Label>
                  <Select defaultValue="system">
                    <SelectTrigger id="theme" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t("themeLight")}</SelectItem>
                      <SelectItem value="dark">{t("themeDark")}</SelectItem>
                      <SelectItem value="system">{t("themeSystem")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success(t("dataSaved"))}>{t("saveChanges")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-h3">{t("changePassword")}</CardTitle>
              <CardDescription>{t("changePasswordDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pw">{t("currentPassword")}</Label>
                <Input id="current-pw" type="password" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pw">{t("newPassword")}</Label>
                <Input
                  id="new-pw"
                  type="password"
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {newPassword.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Progress value={(score / 4) * 100} className={`h-1.5 [&>div]:${scoreColor[score]}`} />
                    <p className="text-caption text-muted-foreground">
                      {t("strengthLabel")}: {t(scoreLabelKeys[score])}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={newPassword.length < 8}
                  onClick={() => {
                    setNewPassword("");
                    toast.success(t("passwordChanged"));
                  }}
                >
                  {t("updatePassword")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-h3">{t("twoFactor")}</CardTitle>
                <CardDescription>{t("twoFactorDesc")}</CardDescription>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} aria-label={t("twoFactorToggleLabel")} />
            </CardHeader>
            {twoFactor && (
              <CardContent>
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-4 text-small">
                  <ShieldCheck className="size-5 shrink-0 text-[#1F5130]" strokeWidth={1.5} />
                  <p>{t("twoFactorSetup")}</p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-h3">{t("activeSessions")}</CardTitle>
                <CardDescription>{t("activeSessionsDesc")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSignOutOpen(true)}>
                <LogOut className="size-4" strokeWidth={1.5} />
                {t("signOutOthers")}
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
                          <div className="text-small font-medium" dir="ltr">
                            {locale === "ar" ? s.deviceAr : s.deviceEn}
                          </div>
                          <div className="text-caption text-muted-foreground">{locale === "ar" ? s.cityAr : s.cityEn}</div>
                        </div>
                      </div>
                      {s.current && (
                        <span className="text-caption font-medium text-[#1F5130]">{t("currentSession")}</span>
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
            <AlertDialogTitle>{t("signOutOthersTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("signOutOthersDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSignOutOpen(false);
                toast.success(t("signedOutOthers"));
              }}
            >
              {t("signOut")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
