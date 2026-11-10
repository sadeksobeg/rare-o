import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** ADM-03 — CSV export of admin audit log (auth required). */
export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action")?.trim() || "";

  const rows = await prisma.adminAuditLog.findMany({
    where: action ? { action: { contains: action } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const header = ["createdAt", "adminId", "action", "target", "ip"].join(",");
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.adminId ?? "",
      r.action,
      r.target,
      r.ip,
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(",")
  );

  const body = [header, ...lines].join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="admin-audit.csv"',
      "Cache-Control": "no-store",
    },
  });
}
