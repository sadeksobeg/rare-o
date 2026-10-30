import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getTraderSessionDb } from "@/lib/auth/trader-session";
import { uploadsRoot } from "@/lib/brokerage/media";

/** Server-generated names only — see saveBrokeragePhotos in lib/brokerage/media.ts. */
const FILE_NAME_RE = /^[0-9]+-[0-9a-f]{12}\.webp$/;

function notFound() {
  // Always 404, never 403 — do not reveal whether the request exists.
  return new NextResponse(null, { status: 404 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string; file: string }> }
) {
  const { requestId, file } = await params;

  if (!FILE_NAME_RE.test(file) || !requestId || requestId.includes("..")) {
    return notFound();
  }

  const [adminSession, traderSession] = await Promise.all([
    getAdminSession(),
    getTraderSessionDb(),
  ]);
  if (!adminSession && !traderSession) {
    return notFound();
  }
  // A session forced to change its password is not fully authenticated for
  // any protected resource — same gate as requireAdminSession/
  // requireTraderSession apply everywhere else (AUDIT-PHASE-1.md, L-1).
  // Admin takes priority when both cookies are present, matching the
  // ownership check below.
  if (adminSession) {
    if (adminSession.mustChangePassword) return notFound();
  } else if (traderSession?.mustChangePassword) {
    return notFound();
  }

  const row = await prisma.brokerageRequest.findUnique({
    where: { id: requestId },
    select: { id: true, traderId: true },
  });
  if (!row) return notFound();

  if (!adminSession) {
    if (!traderSession || row.traderId !== traderSession.sub) {
      return notFound();
    }
  }

  const root = uploadsRoot();
  const filePath = path.join(root, requestId, file);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(root) + path.sep)) {
    return notFound();
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(resolved);
  } catch {
    return notFound();
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
