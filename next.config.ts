import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { execSync } from "node:child_process";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

function resolveGitSha(): string {
  const fromEnv =
    process.env.RO_GIT_SHA?.trim() ||
    process.env.GIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (fromEnv) return fromEnv.slice(0, 40);
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
      .slice(0, 40);
  } catch {
    return "unknown";
  }
}

const RO_GIT_SHA = resolveGitSha();
const RO_BUILD_TIME = process.env.RO_BUILD_TIME?.trim() || new Date().toISOString();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Inbox needs mic (PTT) + camera capture; geolocation stays off.
    value: "camera=(self), microphone=(self), geolocation=()",
  },
  // CSP with nonces is applied in middleware.ts (PARTIAL on routes outside matcher).
];

const nextConfig: NextConfig = {
  // Required for the multi-stage production Dockerfile (standalone server).
  output: "standalone",
  // Tree-shake lucide icon imports (material LH unused-JS win on portal shells).
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // WA-W2 outbound media (images ≤10MB, docs ≤25MB) via server actions.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Expose the promo UI gate to client components (PriceBlock in client trees).
  // Build identity is also available server-side via process.env for /api/health.
  env: {
    RO_PROMO_FEATURES: process.env.RO_PROMO_FEATURES ?? "",
    RO_GIT_SHA,
    RO_BUILD_TIME,
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const headers = [...securityHeaders];
    if (isProd) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      { source: "/:path*", headers },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
