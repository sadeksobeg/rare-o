import { NextResponse } from "next/server";
import { getTraderSession } from "@/lib/auth/trader-session";
import { getTraderConversationCursor } from "@/lib/whatsapp/messaging/trader-channel";

export const dynamic = "force-dynamic";

/** Cheap poll endpoint — lastMessageId / updatedAt / unread only (no bodies). */
export async function GET() {
  const session = await getTraderSession();
  if (!session || session.mustChangePassword) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const cursor = await getTraderConversationCursor(session.sub);
  return NextResponse.json({
    ok: true,
    conversationId: cursor?.conversationId ?? null,
    lastMessageId: cursor?.lastMessageId ?? null,
    updatedAt: cursor?.updatedAt ?? null,
    unreadCount: cursor?.unreadCount ?? 0,
  });
}
