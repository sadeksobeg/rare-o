/**
 * WA-W2 quick-reply templates + variable fill.
 */

import { prisma as defaultPrisma } from "@/lib/db/prisma";
import type { Locale } from "@/lib/i18n/config";

export type QuickReplyTemplateView = {
  id: string;
  title: string;
  body: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  category: string | null;
  sortOrder: number;
};

export type QuickReplyContext = {
  name?: string | null;
  requestRef?: string | null;
};

export function fillQuickReplyVariables(
  template: string,
  ctx: QuickReplyContext
): string {
  return template
    .replaceAll("{name}", (ctx.name ?? "").trim() || "—")
    .replaceAll("{request_ref}", (ctx.requestRef ?? "").trim() || "—");
}

export async function listQuickReplyTemplates(
  locale: Locale,
  db: typeof defaultPrisma = defaultPrisma
): Promise<QuickReplyTemplateView[]> {
  const rows = await db.whatsAppQuickReplyTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    title: locale === "ar" ? r.titleAr : r.titleEn,
    body: locale === "ar" ? r.bodyAr : r.bodyEn,
    titleAr: r.titleAr,
    titleEn: r.titleEn,
    bodyAr: r.bodyAr,
    bodyEn: r.bodyEn,
    category: r.category,
    sortOrder: r.sortOrder,
  }));
}

export async function upsertQuickReplyTemplate(input: {
  id?: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  category?: string | null;
  sortOrder?: number;
  adminId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const titleAr = input.titleAr.trim();
  const titleEn = input.titleEn.trim();
  const bodyAr = input.bodyAr.trim();
  const bodyEn = input.bodyEn.trim();
  if (!titleAr || !titleEn || !bodyAr || !bodyEn) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  if (input.id) {
    const row = await defaultPrisma.whatsAppQuickReplyTemplate.update({
      where: { id: input.id },
      data: {
        titleAr,
        titleEn,
        bodyAr,
        bodyEn,
        category: input.category?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  }
  const row = await defaultPrisma.whatsAppQuickReplyTemplate.create({
    data: {
      titleAr,
      titleEn,
      bodyAr,
      bodyEn,
      category: input.category?.trim() || null,
      sortOrder: input.sortOrder ?? 0,
      createdByAdminId: input.adminId,
    },
    select: { id: true },
  });
  return { ok: true, id: row.id };
}

export async function deleteQuickReplyTemplate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await defaultPrisma.whatsAppQuickReplyTemplate.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "NOT_FOUND" };
  }
}

/** Seed three defaults when the table is empty (first open). */
export async function ensureDefaultQuickReplies(
  adminId: string
): Promise<void> {
  const count = await defaultPrisma.whatsAppQuickReplyTemplate.count();
  if (count > 0) return;
  await defaultPrisma.whatsAppQuickReplyTemplate.createMany({
    data: [
      {
        titleAr: "ترحيب",
        titleEn: "Greeting",
        bodyAr: "مرحباً {name}، كيف نقدر نساعدك؟",
        bodyEn: "Hello {name}, how can we help?",
        category: "general",
        sortOrder: 1,
        createdByAdminId: adminId,
      },
      {
        titleAr: "متابعة طلب",
        titleEn: "Follow-up",
        bodyAr: "بخصوص طلبك {request_ref}، هل ما زلت مهتماً؟",
        bodyEn: "Regarding your request {request_ref}, are you still interested?",
        category: "general",
        sortOrder: 2,
        createdByAdminId: adminId,
      },
      {
        titleAr: "شكر",
        titleEn: "Thanks",
        bodyAr: "شكراً لتواصلك، {name}. نحن بخدمتك.",
        bodyEn: "Thank you for reaching out, {name}. We're here to help.",
        category: "general",
        sortOrder: 3,
        createdByAdminId: adminId,
      },
    ],
  });
}
