import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness + basic dependency check for reverse proxies / uptime monitors. */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: "up",
      ms: Date.now() - started,
      ts: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        ms: Date.now() - started,
        ts: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
