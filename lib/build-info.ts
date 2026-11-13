/**
 * Build identity exposed on /api/health so ops can confirm which SHA is live
 * without SSH. Values are baked at image/build time (see Dockerfile + next.config).
 */
export function getBuildInfo(): { sha: string; builtAt: string } {
  const sha =
    process.env.RO_GIT_SHA?.trim() ||
    process.env.GIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    "unknown";
  const builtAt =
    process.env.RO_BUILD_TIME?.trim() ||
    process.env.BUILD_TIME?.trim() ||
    "unknown";
  // Public health: short SHA only (no full commit hash).
  return { sha: sha === "unknown" ? "unknown" : sha.slice(0, 7), builtAt };
}
