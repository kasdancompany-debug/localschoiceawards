import "server-only";

import { buildCommunityHostname } from "@/lib/communities/hostname";
import { env } from "@/lib/env/server";
import type { Community } from "@/types/community";
import type { Metadata } from "next";

export function getCommunityCanonicalUrl(community: Community, pathname = "/"): string {
  const root = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const protocol = root.includes("localhost") ? "http" : "https";
  const origin = buildCommunityHostname(community.subdomain, root, protocol);
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function buildCommunityMetadata(community: Community, options?: {
  title?: string;
  description?: string;
  pathname?: string;
}): Metadata {
  const title = options?.title ?? community.displayName;
  const description =
    options?.description ??
    `Locals Choice Awards for ${community.name}, ${community.region.name}. Vote for local favourites.`;
  const canonical = getCommunityCanonicalUrl(community, options?.pathname ?? "/");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Locals Choice Awards",
      locale: community.country.defaultLocale.replace("-", "_"),
      type: "website",
    },
  };
}
