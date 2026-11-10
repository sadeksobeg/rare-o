import { prisma } from "@/lib/db/prisma";
import {
  getCachedOutboundKillSwitch,
  isOutboundEnvEnabled,
  primeOutboundKillSwitch,
  syncOutboundKillSwitch,
} from "@/lib/whatsapp/types";
import { publishInboxEvent } from "@/lib/whatsapp/messaging/inbox-events";
import { WHATSAPP_CONNECTION_HEALTH_ID } from "@/lib/whatsapp/messaging/constants";
import { configureGlobalEnqueueRateLimit } from "@/lib/whatsapp/messaging/enqueue-rate-limit";

export type KillSwitchActor = {
  by: string;
  reason?: string | null;
};

export async function refreshOutboundKillSwitchFromDb(): Promise<boolean> {
  return syncOutboundKillSwitch(async () => {
    const row = await prisma.whatsAppConnectionHealth.findUnique({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      select: {
        outboundKillSwitch: true,
        outboundGlobalRatePerMin: true,
      },
    });
    if (row?.outboundGlobalRatePerMin) {
      configureGlobalEnqueueRateLimit(row.outboundGlobalRatePerMin);
    }
    return row?.outboundKillSwitch ?? false;
  });
}

export async function setOutboundKillSwitch(
  enabled: boolean,
  connectionStateHint?: string,
  actor?: KillSwitchActor
): Promise<
  | {
      ok: true;
      outboundEnabled: boolean;
      killSwitch: boolean;
      killSwitchAt: string | null;
      killSwitchBy: string | null;
      killSwitchReason: string | null;
    }
  | { ok: false; error: string }
> {
  try {
    const now = new Date();
    const by = actor?.by?.trim().slice(0, 120) || null;
    const reason = actor?.reason?.trim().slice(0, 240) || null;
    const row = await prisma.whatsAppConnectionHealth.upsert({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      create: {
        id: WHATSAPP_CONNECTION_HEALTH_ID,
        state: connectionStateHint || "DISCONNECTED",
        outboundKillSwitch: enabled,
        outboundKillSwitchAt: enabled ? now : null,
        outboundKillSwitchBy: by,
        outboundKillSwitchReason: enabled ? reason : null,
      },
      update: {
        outboundKillSwitch: enabled,
        outboundKillSwitchAt: enabled ? now : null,
        outboundKillSwitchBy: by,
        outboundKillSwitchReason: enabled ? reason : null,
      },
      select: {
        outboundKillSwitch: true,
        outboundKillSwitchAt: true,
        outboundKillSwitchBy: true,
        outboundKillSwitchReason: true,
        state: true,
      },
    });
    primeOutboundKillSwitch(row.outboundKillSwitch);
    const outboundEnabled =
      isOutboundEnvEnabled() && !row.outboundKillSwitch;
    await publishInboxEvent("connection.state", {
      connectionState: row.state,
      outboundEnabled,
      outboundKillSwitch: row.outboundKillSwitch,
      outboundKillSwitchAt: row.outboundKillSwitchAt?.toISOString() ?? null,
      outboundKillSwitchBy: row.outboundKillSwitchBy,
      outboundKillSwitchReason: row.outboundKillSwitchReason,
    });
    return {
      ok: true,
      outboundEnabled,
      killSwitch: row.outboundKillSwitch,
      killSwitchAt: row.outboundKillSwitchAt?.toISOString() ?? null,
      killSwitchBy: row.outboundKillSwitchBy,
      killSwitchReason: row.outboundKillSwitchReason,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "kill switch update failed";
    return { ok: false, error: message.slice(0, 160) };
  }
}

export async function setOutboundGlobalRatePerMin(
  perMin: number
): Promise<{ ok: true; perMin: number } | { ok: false; error: string }> {
  const n = Math.max(1, Math.min(Math.floor(perMin), 120));
  try {
    await prisma.whatsAppConnectionHealth.upsert({
      where: { id: WHATSAPP_CONNECTION_HEALTH_ID },
      create: {
        id: WHATSAPP_CONNECTION_HEALTH_ID,
        state: "DISCONNECTED",
        outboundGlobalRatePerMin: n,
      },
      update: { outboundGlobalRatePerMin: n },
    });
    configureGlobalEnqueueRateLimit(n);
    return { ok: true, perMin: n };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "rate update failed";
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
