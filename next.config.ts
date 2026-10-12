import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose the promo UI gate to client components (PriceBlock in client trees).
  // Default empty / off — set RO_PROMO_FEATURES=1 to enable.
  env: {
    RO_PROMO_FEATURES: process.env.RO_PROMO_FEATURES ?? "",
  },
};

export default nextConfig;
