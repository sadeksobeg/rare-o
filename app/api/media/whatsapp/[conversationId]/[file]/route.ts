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
import {
  isSafeWhatsAppConversationId,
  resolveWhatsAppServeContentType,
} from "@/lib/whatsapp/media-serve";

function notFound() {
  return new NextResponse(null, { status: 404 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; file: string }> }
) {
  const { conversationId: rawConv, file: rawFile } = await params;
  // Decode once — reject encoded traversal (%2e%2e) after decode
  let conversationId = rawConv;
  let file = rawFile;
  try {
    conversationId = decodeURIComponent(rawConv);
    file = decodeURIComponent(rawFile);
  } catch {
    return notFound();
  }

  if (
    !isSafeWhatsAppConversationId(conversationId) ||
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
  const rootResolved = path.resolve(root);
  const filePath = path.join(root, conversationId, file);
  const resolved = path.resolve(filePath);
  if (
    resolved !== path.join(rootResolved, conversationId, file) &&
    !resolved.startsWith(rootResolved + path.sep)
  ) {
    return notFound();
  }
  // Strict: file must live exactly under root/conversationId/
  const expectedDir = path.resolve(root, conversationId);
  if (!resolved.startsWith(expectedDir + path.sep)) {
    return notFound();
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(resolved);
  } catch {
    return notFound();
  }

  const { contentType, disposition } = resolveWhatsAppServeContentType(
    bytes,
    message.mediaMime,
    file
  );

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": disposition,
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
