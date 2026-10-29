"use client";

import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LocaleToggle } from "@/components/brand/locale-toggle";
import { currentAdmin, greetingForHour } from "@/lib/fixtures";
import { formatDate } from "@/lib/format";
import { useLocale, useDict } from "@/lib/i18n";
import { topbarDict } from "@/lib/dictionaries";
import Link from "next/link";

export function AdminTopbar() {
  const { locale } = useLocale();
  const t = useDict(topbarDict);
  const name = locale === "ar" ? currentAdmin.name : currentAdmin.nameEn;
  const [greeting, setGreeting] = useState(() => greetingForHour(8, name, locale));
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    setGreeting(greetingForHour(now.getHours(), name, locale));
    setDateLabel(formatDate(now, locale, { weekday: "long", day: "numeric", month: "long" }));
  }, [locale, name]);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-h3 font-semibold">{greeting}</h1>
          <p className="text-small text-muted-foreground">{dateLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="hidden min-w-56 justify-start gap-2 text-muted-foreground sm:flex">
          <Search className="size-4" strokeWidth={1.5} />
          {t("searchPlaceholder")}
          <kbd className="ms-auto rounded border bg-muted px-1.5 text-caption">Ctrl K</kbd>
        </Button>
        <Button variant="outline" size="icon" aria-label={t("notifications")}>
          <Bell className="size-5" strokeWidth={1.5} />
        </Button>
        <LocaleToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full" aria-label={t("accountMenu")}>
              <Avatar>
                <AvatarFallback className="bg-ro-plum-100 text-ro-plum-900">{name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{name}</div>
              <div className="text-caption font-normal text-muted-foreground" dir="ltr">
                {currentAdmin.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">{t("myAccount")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/team">{t("manageTeam")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" asChild>
              <Link href="/login">{t("signOut")}</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
