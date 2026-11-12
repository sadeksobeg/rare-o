/**
 * WhatsApp / disk ops alerts for the admin notification panel.
 * No migration: de-dupe via AdminAuditLog actions.
 *
 * Outage rules (R2):
 * - Alert when the session *was* CONNECTED (lastConnectedAt set) and then stays
 *   down longer than N minutes — independent of CONNECT_ON_START.
 * - Suppress when: never connected (no lastConnectedAt), owner intentional
 *   disconnect (lastConnectedAt cleared + marker), or kill switch on.
 * - Worker restart that reconnects within N minutes must not alert.
 */
import { prisma } from "@/lib/db/prisma";
import fs from "node:fs";
import path from "node:path";

export const OUTAGE_ACTION = "whatsapp.outage_alert";
export const RECOVERY_ACTION = "whatsapp.recovered_alert";
const DISK_ACTION = "ops.disk_alert";

/** Stored in detailSafe when the owner presses Disconnect / Logout. */
export const INTENTIONAL_DISCONNECT_MARKER = "intentional_disconnect";

export function disconnectAlertMinutes(): number {
  const raw = Number(process.env.WHATSAPP_DISCONNECT_ALERT_MINUTES ?? "5");
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

export type OpsAlertItem = {
  id: string;
  href: string;
  title: string;
  body?: string;
  unread?: boolean;
};

type HealthRow = {
  state: string;
  detailSafe: string | null;
  lastConnectedAt: Date | null;
  lastHeartbeatAt: Date | null;
  updatedAt: Date;
  outboundKillSwitch: boolean;
};

function isIntentionalDisconnect(row: HealthRow): boolean {
  if (!row.lastConnectedAt) return true; // never connected OR cleared on logout
  const detail = (row.detailSafe ?? "").toLowerCase();
  return detail.includes(INTENTIONAL_DISCONNECT_MARKER);
}

async function writeOpsAudit(action: string, target: string, meta: Record<string, unknown>) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: null,
      action,
      target,
      metaJson: JSON.stringify(meta),
      ip: "",
    },
  });
}

/**
 * Pure decision helper (unit-testable): should we surface an outage / recovery?
 * Returns null = silent.
 */
export function evaluateWhatsAppOutageAlert(
  row: HealthRow | null,
  nowMs: number,
  minutes: number
): { kind: "outage" | "recovery"; outageKey: string } | null {
  if (!row) return null;
  if (row.outboundKillSwitch) return null;
  if (isIntentionalDisconnect(row)) return null;

  const state = row.state.toUpperCase();
  const thresholdMs = minutes * 60_000;
  const outageKey = row.lastConnectedAt!.toISOString();

  if (state === "CONNECTED" || state === "CONNECTING") {
    return { kind: "recovery", outageKey };
  }

  // DISCONNECTED / ERROR / AUTHENTICATION_REQUIRED after a prior connection
  const anchor = row.lastHeartbeatAt ?? row.updatedAt;
  if (!anchor) return null;
  const age = nowMs - anchor.getTime();
  if (age < thresholdMs) return null; // includes worker restart that reconnects soon
  return { kind: "outage", outageKey };
}

/** Evaluate disconnect outage; write at most one audit row per outage window. */
export async function syncWhatsAppOutageAlert(
  nowMs: number = Date.now()
): Promise<OpsAlertItem | null> {
  const row = await prisma.whatsAppConnectionHealth.findUnique({
    where: { id: "default" },
  });
  if (!row) return null;

  const minutes = disconnectAlertMinutes();
  const decision = evaluateWhatsAppOutageAlert(row, nowMs, minutes);
  if (!decision) return null;

  if (decision.kind === "recovery") {
    const open = await prisma.adminAuditLog.findFirst({
      where: { action: OUTAGE_ACTION },
      orderBy: { createdAt: "desc" },
    });
    if (!open) return null;
    const alreadyRecovered = await prisma.adminAuditLog.findFirst({
      where: {
        action: RECOVERY_ACTION,
        createdAt: { gt: open.createdAt },
      },
    });
    if (alreadyRecovered) return null;
    await writeOpsAudit(RECOVERY_ACTION, open.target || decision.outageKey, {
      state: row.state,
      recoveredAt: new Date(nowMs).toISOString(),
    });
    return {
      id: "wa-recovered",
      href: "/admin/inbox",
      title: "__wa_recovered__",
      body: row.state,
      unread: true,
    };
  }

  const prior = await prisma.adminAuditLog.findFirst({
    where: { action: OUTAGE_ACTION, target: decision.outageKey },
  });
  if (!prior) {
    const anchor = row.lastHeartbeatAt ?? row.updatedAt;
    await writeOpsAudit(OUTAGE_ACTION, decision.outageKey, {
      state: row.state,
      minutes,
      ageMinutes: anchor
        ? Math.round((nowMs - anchor.getTime()) / 60_000)
        : null,
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

/**
 * Mark an owner-initiated disconnect so soak-test manual connect still alerts
 * on unexpected drops, but Disconnect/Logout does not.
 */
export async function markIntentionalDisconnect(
  detail = "Logged out - pairing required"
): Promise<void> {
  const detailSafe = `${INTENTIONAL_DISCONNECT_MARKER}: ${detail}`.slice(0, 300);
  await prisma.whatsAppConnectionHealth.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      state: "AUTHENTICATION_REQUIRED",
      detailSafe,
      lastConnectedAt: null,
      linkCommand: "none",
    },
    update: {
      state: "AUTHENTICATION_REQUIRED",
      detailSafe,
      lastConnectedAt: null,
      linkCommand: "none",
      pairingPhone: null,
      pairingCode: null,
      qrDataUrl: null,
      pairingExpiresAt: null,
    },
  });
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
        await writeOpsAudit(DISK_ACTION, target, { pct, threshold, root });
      }
      items.push({
        id: `disk-${threshold}-${root}`,
        href: "/admin/notifications",
        title: "__disk_alert__",
        body: `${threshold}|${pct}`,
        unread: true,
      });
      break;
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
