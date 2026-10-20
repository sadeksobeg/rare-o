import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export type AdminAuditAction =
  | "admin.login"
  | "admin.login.recovery_code"
  | "admin.totp.enabled"
  | "product.publish"
  | "trader.create";

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  return h.get("x-real-ip") ?? "";
}

function formatTarget(input: {
  target?: string | null;
  targetType?: string | null;
  targetId?: string | null;
}): string {
  if (input.target?.trim()) return input.target.trim();
  if (input.targetType && input.targetId) {
    return `${input.targetType}:${input.targetId}`;
  }
  return "";
}

export async function writeAdminAudit(input: {
  adminId?: string | null;
  action: AdminAuditAction | string;
  target?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        target: formatTarget(input),
        metaJson: JSON.stringify(input.meta ?? {}),
        ip: await clientIp(),
      },
    });
  } catch (e) {
    console.error("admin_audit_log_failed", e);
  }
}
