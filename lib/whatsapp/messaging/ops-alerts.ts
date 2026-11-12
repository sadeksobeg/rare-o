/**
 * WhatsApp / disk ops alerts for the admin notification panel.
 * No migration: de-dupe via AdminAuditLog actions.
 */
import { prisma } from "@/lib/db/prisma";
import { writeAdminAudit } from "@/lib/auth/admin-audit";
import fs from "node:fs";
import path from "node:path";

const OUTAGE_ACTION = "whatsapp.outage_alert";
const RECOVERY_ACTION = "whatsapp.recovered_alert";
const DISK_ACTION = "ops.disk_alert";

export function disconnectAlertMinutes(): number {
  const raw = Number(process.env.WHATSAPP_DISCONNECT_ALERT_MINUTES ?? "5");
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

function connectOnStartEnabled(): boolean {
  return String(process.env.WHATSAPP_CONNECT_ON_START ?? "false").toLowerCase() === "true";
}

export type OpsAlertItem = {
  id: string;
  href: string;
  title: string;
  body?: string;
  unread?: boolean;
};

/** Evaluate disconnect outage; write at most one audit row per outage window. */
export async function syncWhatsAppOutageAlert(): Promise<OpsAlertItem | null> {
  if (!connectOnStartEnabled()) return null;

  const row = await prisma.whatsAppConnectionHealth.findUnique({
    where: { id: "default" },
  });
  if (!row) return null;
  if (row.outboundKillSwitch) return null;
  if (!row.lastConnectedAt) return null;

  const state = row.state.toUpperCase();
  const minutes = disconnectAlertMinutes();
  const thresholdMs = minutes * 60_000;

  if (state === "CONNECTED" || state === "CONNECTING") {
    const open = await prisma.adminAuditLog.findFirst({
      where: { action: OUTAGE_ACTION },
      orderBy: { createdAt: "desc" },
    });
    if (open) {
      const alreadyRecovered = await prisma.adminAuditLog.findFirst({
        where: {
          action: RECOVERY_ACTION,
          createdAt: { gt: open.createdAt },
        },
      });
      if (!alreadyRecovered) {
        await writeAdminAudit({
          action: RECOVERY_ACTION,
          target: open.target || "default",
          meta: { state, recoveredAt: new Date().toISOString() },
        });
        return {
          id: "wa-recovered",
          href: "/admin/inbox",
          title: "__wa_recovered__",
          body: state,
          unread: true,
        };
      }
    }
    return null;
  }

  // DISCONNECTED / ERROR / AUTHENTICATION_REQUIRED
  const anchor = row.lastHeartbeatAt ?? row.updatedAt;
  if (!anchor) return null;
  const age = Date.now() - anchor.getTime();
  if (age < thresholdMs) return null;

  const outageKey = (row.lastConnectedAt ?? anchor).toISOString();
  const prior = await prisma.adminAuditLog.findFirst({
    where: { action: OUTAGE_ACTION, target: outageKey },
  });
  if (!prior) {
    await writeAdminAudit({
      action: OUTAGE_ACTION,
      target: outageKey,
      meta: {
        state,
        minutes,
        ageMinutes: Math.round(age / 60_000),
      },
    });
  }

  return {
    id: "wa-outage",
    href: "/admin/inbox",
    title: "__wa_outage__",
    body: String(minutes),
    unread: true,
  };
}

function diskRoots(): string[] {
  const fromEnv = process.env.DISK_ALERT_PATHS?.split(path.delimiter).filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  const auth = process.env.WHATSAPP_AUTH_DIR?.trim();
  const roots = [
    auth || path.join(process.cwd(), ".wa-auth"),
    path.join(process.cwd(), "storage", "uploads"),
    "/var/lib/rareoud",
  ];
  return [...new Set(roots)];
}

type StatFsLike = {
  bavail: number | bigint;
  blocks: number | bigint;
  bsize: number | bigint;
};

function usagePercent(root: string): number | null {
  try {
    if (!fs.existsSync(root)) return null;
    const statfs = (fs as unknown as { statfsSync?: (p: string) => StatFsLike }).statfsSync;
    if (!statfs) return null;
    const s = statfs(root);
    const bsize = Number(s.bsize);
    const blocks = Number(s.blocks);
    const bavail = Number(s.bavail);
    if (!bsize || !blocks) return null;
    const used = blocks - bavail;
    return Math.round((used / blocks) * 1000) / 10;
  } catch {
    return null;
  }
}

/** Disk pressure alerts at 80% and 90% (one audit row per threshold per day). */
export async function syncDiskAlerts(): Promise<OpsAlertItem[]> {
  const items: OpsAlertItem[] = [];
  const day = new Date().toISOString().slice(0, 10);
  for (const root of diskRoots()) {
    const pct = usagePercent(root);
    if (pct == null) continue;
    for (const threshold of [90, 80] as const) {
      if (pct < threshold) continue;
      const target = `${threshold}:${day}:${root}`;
      const prior = await prisma.adminAuditLog.findFirst({
        where: { action: DISK_ACTION, target },
      });
      if (!prior) {
        await writeAdminAudit({
          action: DISK_ACTION,
          target,
          meta: { pct, threshold, root },
        });
      }
      items.push({
        id: `disk-${threshold}-${root}`,
        href: "/admin/notifications",
        title: "__disk_alert__",
        body: `${threshold}|${pct}`,
        unread: true,
      });
      break; // one item per root (highest threshold wins)
    }
  }
  return items;
}

export async function listOpsAlertItems(): Promise<OpsAlertItem[]> {
  const out: OpsAlertItem[] = [];
  const wa = await syncWhatsAppOutageAlert();
  if (wa) out.push(wa);
  out.push(...(await syncDiskAlerts()));
  return out;
}
