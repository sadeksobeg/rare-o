import { prisma } from "@/lib/db/prisma";
import {
  getCachedOutboundKillSwitch,
  isOutboundEnvEnabled,
  primeOutboundKillSwitch,
  syncOutboundKillSwitch,
} from "@/lib/whatsapp/types";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";

export async function refreshOutboundKillSwitchFromDb(): Promise<boolean> {
  return syncOutboundKillSwitch(async () => {
    const row = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      select: { outboundKillSwitch: true },
    });
    return row?.outboundKillSwitch ?? false;
  });
}

export async function setOutboundKillSwitch(
  enabled: boolean,
  connectionStateHint?: string
): Promise<{ ok: true; outboundEnabled: boolean } | { ok: false; error: string }> {
  try {
    const row = await prisma.whatsAppConnectionHealth.upsert({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      create: {
        id: WHATSAPP_CONNECTION_HEALTH_ID,
        state: connectionStateHint || "DISCONNECTED",
        outboundKillSwitch: enabled,
      },
      update: { outboundKillSwitch: enabled },
      select: { outboundKillSwitch: true, state: true },
    });
    primeOutboundKillSwitch(row.outboundKillSwitch);
    const outboundEnabled =
      isOutboundEnvEnabled() && !row.outboundKillSwitch;
    await publishInboxEvent("connection.state", {
      connectionState: row.state,
      outboundEnabled,
      outboundKillSwitch: row.outboundKillSwitch,
    });
    return { ok: true, outboundEnabled };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "kill switch update failed";
    return { ok: false, error: message.slice(0, 160) };
  }
}

export function readOutboundEnabledSnapshot(): {
  envEnabled: boolean;
  killSwitch: boolean;
  outboundEnabled: boolean;
} {
  const envEnabled = isOutboundEnvEnabled();
  const killSwitch = getCachedOutboundKillSwitch();
  return {
    envEnabled,
    killSwitch,
    outboundEnabled: envEnabled && !killSwitch,
  };
}
