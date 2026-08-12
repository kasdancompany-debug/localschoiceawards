import type { MetadataRoute } from "next";

import { env } from "@/lib/env/server";

export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/supplier",
          "/supplier/",
          "/business",
          "/business/",
          "/api/",
          "/auth/",
          "/checkout",
          "/cart",
          "/unsubscribe",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
