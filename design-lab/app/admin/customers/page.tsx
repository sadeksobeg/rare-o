"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { customers, retailRequests } from "@/lib/fixtures";

export default function CustomersPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const customer = customers.find((c) => c.id === openId);
  const customerRequests = customer
    ? retailRequests.filter((r) => r.customerAr === customer.name)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">العملاء</h1>
        <p className="text-small text-muted-foreground">عملاء المتجر العام الذين قدّموا طلبات تجزئة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h3">كل العملاء ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>عدد الطلبات</TableHead>
                <TableHead>آخر طلب</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-ro-sand-300 text-ro-ink-700">{c.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell dir="ltr">{c.phone}</TableCell>
                  <TableCell className="tabular-nums">{c.requestsCount}</TableCell>
                  <TableCell className="tabular-nums">{c.lastRequest}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!openId} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>{customer?.name}</SheetTitle>
            <SheetDescription dir="ltr">{customer?.phone}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div>
              <h3 className="mb-2 text-small font-medium text-muted-foreground">طلبات التجزئة</h3>
              <div className="space-y-2">
                {customerRequests.length === 0 && (
                  <p className="text-small text-muted-foreground">لا توجد طلبات مطابقة في بيانات العرض.</p>
                )}
                {customerRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-md border p-3 text-small">
                    <div>
                      <div className="font-mono text-caption" dir="ltr">
                        {r.id}
                      </div>
                      <div className="text-muted-foreground">{r.date}</div>
                    </div>
                    <Badge variant="secondary">{r.statusLabelAr}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
