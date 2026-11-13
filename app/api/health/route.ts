import { getBuildInfo } from "@/lib/build-info";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function mapWaState(raw: string | null | undefined): "connected" | "disconnected" | "reconnecting" {
  const s = (raw ?? "DISCONNECTED").toUpperCase();
  if (s === "CONNECTED") return "connected";
  if (s === "CONNECTING") return "reconnecting";
  return "disconnected";
}

/** Liveness + basic dependency check for reverse proxies / uptime monitors. */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    let whatsapp: { state: "connected" | "disconnected" | "reconnecting" } = {
      state: "disconnected",
    };
    try {
      const row = await prisma.whatsAppConnectionHealth.findUnique({
        where: { id: "default" },
        select: { state: true },
      });
      whatsapp = { state: mapWaState(row?.state) };
    } catch {
      /* health must still answer if WA row missing */
    }
    const build = getBuildInfo();
    return NextResponse.json({
      ok: true,
      db: "up",
      whatsapp,
      build: { sha: build.sha, builtAt: build.builtAt },
      ms: Date.now() - started,
      ts: new Date().toISOString(),
    });
  } catch {
    const build = getBuildInfo();
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        whatsapp: { state: "disconnected" as const },
        build: { sha: build.sha, builtAt: build.builtAt },
        ms: Date.now() - started,
        ts: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
