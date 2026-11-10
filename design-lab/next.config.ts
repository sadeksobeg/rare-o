import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // design-lab is nested inside the main repo (which has its own
  // package.json/middleware.ts/tsconfig). Without an explicit root, Next's
  // workspace-root inference walked up and picked up the PARENT project's
  // middleware.ts instead of design-lab's own (none) - pin the root
  // explicitly so this workspace never reads files from Project A.
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
