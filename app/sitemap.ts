import type { MetadataRoute } from "next";

import { buildCommunityHostname } from "@/lib/communities/hostname";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { env } from "@/lib/env/server";

export const dynamic = "force-dynamic";

const CENTRAL_PATHS = [
  "/",
  "/communities",
  "/about",
  "/how-it-works",
  "/partners",
  "/launch-a-community",
  "/contact",
  "/privacy",
  "/terms",
  "/promotion-rules",
  "/awards",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const root = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const protocol = root.includes("localhost") ? "http" : "https";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = CENTRAL_PATHS.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));

  try {
    const admin = createSupabaseAdminClient();
    const { data: communities } = await admin
      .from("communities")
      .select("subdomain, updated_at, market_status, is_public")
      .eq("is_public", true)
      .neq("market_status", "archived")
      .limit(500);

    for (const community of communities ?? []) {
      const origin = buildCommunityHostname(community.subdomain, root, protocol);
      const lastModified = community.updated_at
        ? new Date(community.updated_at)
        : now;
      for (const path of ["/", "/categories", "/search", "/winners", "/how-it-works", "/rules"]) {
        entries.push({
          url: `${origin}${path === "/" ? "" : path}`,
          lastModified,
          changeFrequency: "weekly",
          priority: path === "/" ? 0.9 : 0.5,
        });
      }
    }
  } catch {
    // Sitemap should still return central URLs if DB is unavailable.
  }

  return entries;
}
