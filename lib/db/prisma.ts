import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function datasourceUrl() {
  const raw = process.env.DATABASE_URL ?? "";
  if (!raw || /connect_timeout=/i.test(raw)) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}connect_timeout=5&pool_timeout=8`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: datasourceUrl() || undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
