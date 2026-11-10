import { NextResponse } from "next/server";
import { searchAdminCommand } from "@/lib/admin/command-search";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json([], { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const hits = await searchAdminCommand(q);
  return NextResponse.json(hits);
}
