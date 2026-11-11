"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions";
import {
  handleTraderSessionError,
  requireTraderSession,
} from "@/lib/auth/trader-session";
import { prisma } from "@/lib/db/prisma";
import {
  markAllTraderNotificationsRead,
  markTraderNotificationRead,
} from "@/lib/trader/notifications";
import { LAUNCH_CATEGORY_SLUGS } from "@/lib/catalog/constants";

export async function traderUpdatePreferencesAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }

  const slugs = formData
    .getAll("interestCategorySlugs")
    .map((v) => String(v).trim())
    .filter(Boolean)
    .filter((s) =>
      (LAUNCH_CATEGORY_SLUGS as readonly string[]).includes(s)
    );
  const interestNotes = String(formData.get("interestNotes") || "").slice(
    0,
    2000
  );

  await prisma.traderAccount.update({
    where: { id: session.sub },
    data: {
      interestCategorySlugs: slugs.join(","),
      interestNotes: interestNotes.trim(),
    },
  });

  revalidatePath("/trader/profile");
  return { ok: true };
}

export async function traderMarkNotificationReadAction(
  formData: FormData
): Promise<void> {
  const session = await requireTraderSession();
  const id = String(formData.get("notificationId") || "");
  if (!id) return;
  await markTraderNotificationRead(session.sub, id);
  revalidatePath("/trader/notifications");
  revalidatePath("/trader");
}

export async function traderMarkAllNotificationsReadAction(): Promise<void> {
  const session = await requireTraderSession();
  await markAllTraderNotificationsRead(session.sub);
  revalidatePath("/trader/notifications");
  revalidatePath("/trader");
}

export async function traderSendMessageAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let session;
  try {
    session = await requireTraderSession();
  } catch (e) {
    return handleTraderSessionError(e);
  }

  const text = String(formData.get("text") || "");
  const { checkTraderSendRateLimit } = await import(
    "@/lib/whatsapp/messaging/trader-send-rate-limit"
  );
  const rate = checkTraderSendRateLimit(session.sub);
  if (!rate.ok) {
    return { ok: false, error: "RATE_LIMITED" };
  }
  const { sendTraderPlatformMessage } = await import(
    "@/lib/whatsapp/messaging/trader-channel"
  );
  const result = await sendTraderPlatformMessage({
    traderId: session.sub,
    text,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  revalidatePath("/trader/messages");
  revalidatePath("/trader");
  return { ok: true };
}
