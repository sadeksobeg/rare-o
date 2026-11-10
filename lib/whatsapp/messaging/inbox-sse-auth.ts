/**
 * Auth gate for /api/admin/inbox/events — kept separate for unit checks.
 */

export type InboxSseAuthResult =
  | { ok: true; sub: string }
  | { ok: false; status: 401 | 403 };

export function mapAdminSessionErrorToSseStatus(
  message: string
): 401 | 403 {
  if (message === "MUST_CHANGE_PASSWORD") return 403;
  return 401;
}

export function authorizeInboxSseFromSession(
  session:
    | { sub: string; mustChangePassword?: boolean }
    | null
    | undefined,
  errorMessage?: string | null
): InboxSseAuthResult {
  if (errorMessage) {
    return { ok: false, status: mapAdminSessionErrorToSseStatus(errorMessage) };
  }
  if (!session?.sub) {
    return { ok: false, status: 401 };
  }
  if (session.mustChangePassword) {
    return { ok: false, status: 403 };
  }
  return { ok: true, sub: session.sub };
}
