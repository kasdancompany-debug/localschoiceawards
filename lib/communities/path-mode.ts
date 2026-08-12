import "server-only";

import { buildCommunityHostname } from "@/lib/communities/hostname";
import {
  pathCommunityCookieName,
  usesPathCommunityUrlsFromEnv,
} from "@/lib/communities/path-mode-edge";
import { env } from "@/lib/env/server";

export {
  isCommunitySurfacePath,
  parsePathCommunityRequest,
  pathCommunityCookieName,
} from "@/lib/communities/path-mode-edge";

export function usesPathCommunityUrls(): boolean {
  return usesPathCommunityUrlsFromEnv();
}

export function buildPublicCommunityUrl(subdomain: string): string {
  const normalized = subdomain.trim().toLowerCase();
  if (usesPathCommunityUrls()) {
    return `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/c/${normalized}`;
  }
  const root = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const protocol = root.includes("localhost") ? "http" : "https";
  return buildCommunityHostname(normalized, root, protocol);
}

export { pathCommunityCookieName as communityPathCookieName };
