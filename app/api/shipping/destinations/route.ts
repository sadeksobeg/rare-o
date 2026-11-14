import { NextResponse } from "next/server";
import { listAvailableDestinations } from "@/lib/shipping/destinations-db";

export const dynamic = "force-dynamic";

/** Public: destinations the team actually ships to (countries/governorates with an active rate). */
export async function GET() {
  try {
    const options = await listAvailableDestinations();
    return NextResponse.json(
      { ok: true, options },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ ok: false, error: "FAILED" }, { status: 500 });
  }
}
