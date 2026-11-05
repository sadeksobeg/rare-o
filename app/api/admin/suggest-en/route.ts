import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { suggestEnglishFromArabic } from "@/lib/i18n/suggest-en";

export const dynamic = "force-dynamic";

/** Draft AR→EN — API (not a Server Action) so the edit form is not remounted. */
export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  let text = "";
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text : "";
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
  }

  const result = await suggestEnglishFromArabic(text);
  return NextResponse.json(result);
}
