/**
 * Per-admin-session SSE connection cap for /api/admin/inbox/events.
 * In-memory only — process-local (fine for single-node Docker web).
 */

const DEFAULT_MAX = 3;

const activeBySession = new Map<string, number>();

export function getInboxSseMaxPerSession(): number {
  const raw = process.env.WHATSAPP_INBOX_SSE_MAX_PER_SESSION?.trim();
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_MAX;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX;
  return Math.min(n, 10);
}

export function tryAcquireInboxSseSlot(sessionId: string): boolean {
  const key = sessionId.trim();
  if (!key) return false;
  const max = getInboxSseMaxPerSession();
  const cur = activeBySession.get(key) ?? 0;
  if (cur >= max) return false;
  activeBySession.set(key, cur + 1);
  return true;
}

export function releaseInboxSseSlot(sessionId: string): void {
  const key = sessionId.trim();
  if (!key) return;
  const cur = activeBySession.get(key) ?? 0;
  if (cur <= 1) {
    activeBySession.delete(key);
    return;
  }
  activeBySession.set(key, cur - 1);
}

/** Test helper */
export function clearInboxSseSlotsForTests(): void {
  activeBySession.clear();
}

export function countInboxSseSlotsForTests(sessionId: string): number {
  return activeBySession.get(sessionId.trim()) ?? 0;
}
