import "server-only";

import { buildPublicCommunityUrl } from "@/lib/communities/path-mode";
import type { Community } from "@/types/community";
import type { Metadata } from "next";

export function getCommunityCanonicalUrl(community: Community, pathname = "/"): string {
  const origin = buildPublicCommunityUrl(community.subdomain);
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
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots:
      community.marketStatus === "archived"
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}
