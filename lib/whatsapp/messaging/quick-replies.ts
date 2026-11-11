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

/** Default catalog — seeded idempotently by titleAr (no migration). */
export const DEFAULT_QUICK_REPLIES = [
  {
    titleAr: "ترحيب",
    titleEn: "Greeting",
    bodyAr: "مرحباً {name}، أهلاً بك في RARE OUD. كيف نقدر نساعدك؟",
    bodyEn: "Hello {name}, welcome to RARE OUD. How can we help?",
    category: "general",
    sortOrder: 1,
  },
  {
    titleAr: "استفسار سعر",
    titleEn: "Price inquiry",
    bodyAr:
      "شكراً لاهتمامك، {name}. بخصوص السعر لطلب {request_ref}: نراجع التوفر ونرسل لك عرضاً خلال ساعات العمل.",
    bodyEn:
      "Thanks for your interest, {name}. For pricing on {request_ref}: we'll check availability and send an offer during business hours.",
    category: "sales",
    sortOrder: 2,
  },
  {
    titleAr: "التوفر",
    titleEn: "Availability",
    bodyAr:
      "{name}، نتحقق من توفّر القطعة المرتبطة بـ {request_ref} ونعود إليك بأقرب وقت.",
    bodyEn:
      "{name}, we're checking availability for {request_ref} and will get back shortly.",
    category: "sales",
    sortOrder: 3,
  },
  {
    titleAr: "الشحن",
    titleEn: "Shipping",
    bodyAr:
      "الشحن متاح حسب الوجهة والوزن. أخبرنا بمدينتك لـ {request_ref} لنقدّر المدة والتكلفة.",
    bodyEn:
      "Shipping depends on destination and weight. Share your city for {request_ref} and we'll estimate time and cost.",
    category: "ops",
    sortOrder: 4,
  },
  {
    titleAr: "طرق الدفع",
    titleEn: "Payment methods",
    bodyAr:
      "نعمل بالتحويل البنكي / واتساب فقط — لا دفع إلكتروني على الموقع. نرسل لك تفاصيل التحويل بعد تأكيد {request_ref}.",
    bodyEn:
      "We work via bank transfer / WhatsApp only — no online card checkout. We'll send transfer details after confirming {request_ref}.",
    category: "ops",
    sortOrder: 5,
  },
  {
    titleAr: "ساعات العمل",
    titleEn: "Working hours",
    bodyAr:
      "ساعات العمل: يومياً 10:00–22:00 (توقيت الرياض). نرد على {name} في أقرب نافذة متاحة.",
    bodyEn:
      "Hours: daily 10:00–22:00 (Riyadh time). We'll reply to {name} in the next available window.",
    category: "general",
    sortOrder: 6,
  },
  {
    titleAr: "شكر",
    titleEn: "Thanks",
    bodyAr: "شكراً لتواصلك، {name}. نحن بخدمتك متى احتجت.",
    bodyEn: "Thank you for reaching out, {name}. We're here whenever you need us.",
    category: "general",
    sortOrder: 7,
  },
  {
    titleAr: "متابعة",
    titleEn: "Follow-up",
    bodyAr:
      "مرحباً {name}، متابعة بخصوص {request_ref} — هل ما زلت مهتماً ونكمل التفاصيل؟",
    bodyEn:
      "Hi {name}, following up on {request_ref} — are you still interested so we can finish the details?",
    category: "sales",
    sortOrder: 8,
  },
] as const;

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

/**
 * Idempotent seed of the 8 default templates (by titleAr).
 * No migration — safe to call on every list open / gate run.
 */
export async function ensureDefaultQuickReplies(
  adminId: string
): Promise<{ added: number; total: number }> {
  const existing = await defaultPrisma.whatsAppQuickReplyTemplate.findMany({
    select: { titleAr: true },
  });
  const have = new Set(existing.map((r) => r.titleAr));
  const missing = DEFAULT_QUICK_REPLIES.filter((d) => !have.has(d.titleAr));
  if (missing.length) {
    await defaultPrisma.whatsAppQuickReplyTemplate.createMany({
      data: missing.map((d) => ({
        titleAr: d.titleAr,
        titleEn: d.titleEn,
        bodyAr: d.bodyAr,
        bodyEn: d.bodyEn,
        category: d.category,
        sortOrder: d.sortOrder,
        createdByAdminId: adminId,
      })),
    });
  }
  const total = await defaultPrisma.whatsAppQuickReplyTemplate.count();
  return { added: missing.length, total };
}
