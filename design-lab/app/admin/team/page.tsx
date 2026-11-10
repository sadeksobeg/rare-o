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
import { useLocale, useDict } from "@/lib/i18n";
import { teamDict } from "@/lib/dictionaries";
import { toast } from "sonner";

type Role = "Owner" | "Manager" | "Staff";

const roleIcon: Record<Role, typeof ShieldCheck> = { Owner: ShieldCheck, Manager: Shield, Staff: UserCog };

const permissionKeys = [
  "permDashboard",
  "permRequests",
  "permProducts",
  "permTraders",
  "permInvite",
  "permAuditLog",
] as const;

const permissions: { key: (typeof permissionKeys)[number]; owner: boolean; manager: boolean; staff: boolean }[] = [
  { key: "permDashboard", owner: true, manager: true, staff: true },
  { key: "permRequests", owner: true, manager: true, staff: true },
  { key: "permProducts", owner: true, manager: true, staff: false },
  { key: "permTraders", owner: true, manager: true, staff: false },
  { key: "permInvite", owner: true, manager: false, staff: false },
  { key: "permAuditLog", owner: true, manager: true, staff: false },
];

export default function TeamPage() {
  const { locale } = useLocale();
  const t = useDict(teamDict);
  const roleLabel: Record<Role, string> = { Owner: t("roleOwner"), Manager: t("roleManager"), Staff: t("roleStaff") };
  const [team, setTeam] = useState(initialTeam);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState<string | null>(null);
  const disableMember = team.find((m) => m.id === disableTarget);
  const disableMemberName = disableMember ? (locale === "ar" ? disableMember.name : disableMember.nameEn) : "";

  function sendInvite() {
    setInviteOpen(false);
    toast.success(t("inviteSent"));
  }

  function confirmDisable() {
    setTeam((prev) =>
      prev.map((m) => (m.id === disableTarget ? { ...m, status: m.status === "active" ? "disabled" : "active" } : m))
    );
    setDisableTarget(null);
    toast.success(t("statusUpdated"));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">{t("pageTitle")}</h1>
          <p className="text-small text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" strokeWidth={1.5} />
          {t("inviteMember")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">
            {t("members")} ({team.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("members")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colMember")}</TableHead>
                <TableHead>{t("colRole")}</TableHead>
                <TableHead>{t("colLastActive")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((m) => {
                const RoleIcon = roleIcon[m.role];
                const name = locale === "ar" ? m.name : m.nameEn;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-ro-plum-100 text-ro-plum-900">
                            {name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-caption text-muted-foreground" dir="ltr">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-small">
                        <RoleIcon className="size-4 text-muted-foreground" strokeWidth={1.5} />
                        {roleLabel[m.role]}
                      </span>
                    </TableCell>
                    <TableCell className="text-small text-muted-foreground">{locale === "ar" ? m.lastActive : m.lastActiveEn}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={m.status === "active" ? "bg-[#DCEBDD] text-[#1F5130]" : "bg-[#F4DADC] text-[#8A2433]"}
                      >
                        {m.status === "active" ? t("statusActive") : t("statusDisabled")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.role !== "Owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More">
                              <MoreHorizontal className="size-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant={m.status === "active" ? "destructive" : "default"}
                              onClick={() => setDisableTarget(m.id)}
                            >
                              {m.status === "active" ? t("disableMembership") : t("enableMembership")}
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
          <CardTitle className="text-h3">{t("permissionsByRole")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("permissionsByRole")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colPermission")}</TableHead>
                <TableHead className="text-center">{t("roleOwner")}</TableHead>
                <TableHead className="text-center">{t("roleManager")}</TableHead>
                <TableHead className="text-center">{t("roleStaff")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((p) => (
                <TableRow key={p.key}>
                  <TableCell>{t(p.key)}</TableCell>
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
            <DialogTitle>{t("inviteTitle")}</DialogTitle>
            <DialogDescription>{t("inviteDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">{t("emailLabel")}</Label>
              <Input id="invite-email" type="email" dir="ltr" placeholder="name@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">{t("roleLabel")}</Label>
              <Select defaultValue="Staff">
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">{t("roleManager")}</SelectItem>
                  <SelectItem value="Staff">{t("roleStaff")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={sendInvite}>{t("sendInvite")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disableMember?.status === "active" ? t("disableConfirmTitleActive") : t("disableConfirmTitleDisabled")} {disableMemberName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disableMember?.status === "active" ? t("disableConsequence") : t("enableConsequence")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>
              {disableMember?.status === "active" ? t("disableMembership") : t("enableMembership")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
