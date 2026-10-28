/** Safe in-portal post-login path from a `returnTo` query or form field. */

export function safePortalReturnTo(
  raw: unknown,
  prefix: "/admin" | "/trader"
): string {
  const fallback = prefix;
  const value = String(raw ?? "").trim();
  if (!value.startsWith(prefix)) return fallback;
  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return fallback;
  }
  if (value.includes("\n") || value.includes("\r")) return fallback;
  return value;
}
