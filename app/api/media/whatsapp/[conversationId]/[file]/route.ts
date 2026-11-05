import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import {
  isSafeWhatsAppMediaFileName,
  whatsappUploadsRoot,
} from "@/lib/whatsapp/media";

function notFound() {
  return new NextResponse(null, { status: 404 });
}

function guessContentType(file: string): string {
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
    case "opus":
      return "audio/ogg";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; file: string }> }
) {
  const { conversationId, file } = await params;

  if (
    !conversationId ||
    conversationId.includes("..") ||
    !isSafeWhatsAppMediaFileName(file)
  ) {
    return notFound();
  }

  const adminSession = await getAdminSession();
  if (!adminSession || adminSession.mustChangePassword) {
    return notFound();
  }

  const message = await prisma.whatsAppMessage.findFirst({
    where: { conversationId, storageKey: `${conversationId}/${file}` },
    select: { mediaMime: true },
  });
  if (!message) return notFound();

  const root = whatsappUploadsRoot();
  const filePath = path.join(root, conversationId, file);
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

  // Prefer the mime recorded at save time (verified, not guessed) — the
  // file extension is a best-effort fallback for rows saved before mime
  // was tracked, or an exotic subtype that didn't map to a known extension.
  const contentType = message.mediaMime?.trim() || guessContentType(file);
  const disposition =
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType.startsWith("audio/")
      ? "inline"
      : `attachment; filename="${file}"`;

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": disposition,
    },
  });
}
