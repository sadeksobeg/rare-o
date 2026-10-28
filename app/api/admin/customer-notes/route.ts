import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const NOTES_MAX = 2000;

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, origin), 303);

  try {
    await requireAdminSession();
  } catch {
    return redirectTo("/admin/login");
  }

  const formData = await request.formData();
  const id = String(formData.get("customerId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "");

  if (!id || notes.length > NOTES_MAX) {
    return redirectTo(`/admin/customers/${id || ""}?notesError=invalid`);
  }

  const existing = await prisma.customer.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return redirectTo("/admin/customers");
  }

  await prisma.customer.update({
    where: { id },
    data: { notes: notes.trim() || null },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  return redirectTo(`/admin/customers/${id}?notesSaved=1`);
}
