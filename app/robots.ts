import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/trader",
          "/dev",
          "/api",
          "/forbidden",
          "/cart",
          "/request",
          "/en/cart",
          "/en/request",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
