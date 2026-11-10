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

  let session;
  try {
    session = await requireAdminSession();
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
    select: { id: true, notes: true },
  });
  if (!existing) {
    return redirectTo("/admin/customers");
  }

  const nextNotes = notes.trim() || null;
  await prisma.customer.update({
    where: { id },
    data: { notes: nextNotes },
  });

  const { writeAdminAudit } = await import("@/lib/auth/admin-audit");
  await writeAdminAudit({
    adminId: session.sub,
    action: "customer.notes_update",
    targetType: "customer",
    targetId: id,
    meta: {
      hadNotes: Boolean(existing.notes?.trim()),
      hasNotes: Boolean(nextNotes),
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  return redirectTo(`/admin/customers/${id}?notesSaved=1`);
}
