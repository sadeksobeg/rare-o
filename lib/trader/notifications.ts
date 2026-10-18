import { prisma } from "@/lib/db/prisma";

export type NotifyTraderInput = {
  traderId: string;
  domain: "deal" | "wholesale" | "system";
  titleAr: string;
  titleEn: string;
  bodyAr?: string;
  bodyEn?: string;
  href: string;
};

export async function notifyTrader(input: NotifyTraderInput) {
  return prisma.traderNotification.create({
    data: {
      traderId: input.traderId,
      domain: input.domain,
      titleAr: input.titleAr.trim(),
      titleEn: input.titleEn.trim(),
      bodyAr: input.bodyAr?.trim() || "",
      bodyEn: input.bodyEn?.trim() || "",
      href: input.href,
    },
  });
}

export async function listTraderNotifications(traderId: string, limit = 40) {
  return prisma.traderNotification.findMany({
    where: { traderId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnreadTraderNotifications(traderId: string) {
  return prisma.traderNotification.count({
    where: { traderId, readAt: null },
  });
}

export async function markTraderNotificationRead(
  traderId: string,
  notificationId: string
) {
  return prisma.traderNotification.updateMany({
    where: { id: notificationId, traderId },
    data: { readAt: new Date() },
  });
}

export async function markAllTraderNotificationsRead(traderId: string) {
  return prisma.traderNotification.updateMany({
    where: { traderId, readAt: null },
    data: { readAt: new Date() },
  });
}
