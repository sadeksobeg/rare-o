import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * WhatsApp worker heartbeat — last health row updatedAt + outbound flag.
 * Monitoring should alert if updatedAt older than 5 minutes while CONNECTED expected.
 */
export async function GET() {
  const started = Date.now();
  try {
    const row = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: "default" },
    });
    const updatedAt = row?.updatedAt?.toISOString() ?? null;
    const ageMs = row?.updatedAt
      ? Date.now() - new Date(row.updatedAt).getTime()
      : null;
    const stale = ageMs != null && ageMs > 5 * 60 * 1000;
    return NextResponse.json({
      ok: true,
      state: row?.state ?? "UNKNOWN",
      updatedAt,
      ageMs,
      stale,
      outboundEnabled: process.env.WHATSAPP_OUTBOUND_ENABLED === "true",
      ms: Date.now() - started,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "heartbeat_failed",
        ms: Date.now() - started,
      },
      { status: 503 }
    );
  }
}
