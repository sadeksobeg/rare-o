import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Readiness for orchestrators — DB up and minimum env present for serving traffic.
 * Liveness remains `/api/health`.
 */
export async function GET() {
  const started = Date.now();
  const checks: Record<string, boolean | string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch {
    checks.db = false;
  }

  const authSecret = process.env.AUTH_SECRET?.trim() ?? "";
  checks.authSecret = authSecret.length >= 16;

  const dbUrl = process.env.DATABASE_URL?.trim();
  checks.databaseUrl = Boolean(dbUrl);

  let whatsappState: "connected" | "disconnected" | "reconnecting" = "disconnected";
  try {
    const row = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: "default" },
      select: { state: true },
    });
    const s = (row?.state ?? "DISCONNECTED").toUpperCase();
    if (s === "CONNECTED") whatsappState = "connected";
    else if (s === "CONNECTING") whatsappState = "reconnecting";
  } catch {
    /* ignore */
  }

  const ready =
    checks.db === true && checks.authSecret === true && checks.databaseUrl === true;

  return NextResponse.json(
    {
      ready,
      checks,
      whatsapp: { state: whatsappState },
      ms: Date.now() - started,
      ts: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
