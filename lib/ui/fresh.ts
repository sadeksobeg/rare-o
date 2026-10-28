/** True when a record was created/updated within the S10 highlight window. */
export function isFresh(
  at: Date | string | number | null | undefined,
  windowMs = 120_000
) {
  if (at == null) return false;
  const t = at instanceof Date ? at.getTime() : new Date(at).getTime();
  return Number.isFinite(t) && Date.now() - t < windowMs;
}
