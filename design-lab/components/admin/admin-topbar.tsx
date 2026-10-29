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
import { currentAdmin, greetingForHour } from "@/lib/fixtures";
import { formatDateAr } from "@/lib/format";
import Link from "next/link";

export function AdminTopbar() {
  const [greeting, setGreeting] = useState(() => greetingForHour(8, currentAdmin.name));
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    setGreeting(greetingForHour(now.getHours(), currentAdmin.name));
    setDateLabel(formatDateAr(now, { weekday: "long", day: "numeric", month: "long" }));
  }, []);

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
          ابحث أو نفّذ أمراً
          <kbd className="ms-auto rounded border bg-muted px-1.5 text-caption">Ctrl K</kbd>
        </Button>
        <Button variant="outline" size="icon" aria-label="الإشعارات">
          <Bell className="size-5" strokeWidth={1.5} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full" aria-label="قائمة الحساب">
              <Avatar>
                <AvatarFallback className="bg-ro-plum-100 text-ro-plum-900">{currentAdmin.avatarInitials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{currentAdmin.name}</div>
              <div className="text-caption font-normal text-muted-foreground" dir="ltr">
                {currentAdmin.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile">حسابي</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/team">إدارة الفريق</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">تسجيل الخروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
