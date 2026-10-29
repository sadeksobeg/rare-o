"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auditLog } from "@/lib/fixtures";

export default function AuditLogPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return auditLog;
    return auditLog.filter((e) => e.actorAr.includes(q) || e.actionAr.includes(q));
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold font-[family-name:var(--font-heading)]">سجلّ الأمان</h1>
        <p className="text-small text-muted-foreground">من فعل ماذا، ومتى — لكل حساب في الفريق</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-h3">الأحداث ({filtered.length})</CardTitle>
          <div className="relative w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالعضو أو الإجراء"
              className="ps-9"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>العضو</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-small tabular-nums text-muted-foreground">{e.time}</TableCell>
                  <TableCell>{e.actionAr}</TableCell>
                  <TableCell className="font-medium">{e.actorAr}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-small text-muted-foreground">
                    لا توجد أحداث مطابقة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
