import "server-only";

import { headers } from "next/headers";

import { parseHostname } from "@/lib/communities/hostname";
import { getPublicCommunityBySubdomain } from "@/lib/communities/service";
import {
  COMMUNITY_SUBDOMAIN_HEADER,
  HOSTNAME_KIND_HEADER,
} from "@/lib/communities/tenant-headers";
import { env } from "@/lib/env/server";
import type { Community } from "@/types/community";

export {
  COMMUNITY_SUBDOMAIN_HEADER,
  HOSTNAME_KIND_HEADER,
} from "@/lib/communities/tenant-headers";

/**
 * Returns the community for the current hostname.
 * Trusts only proxy-injected hostname context — never a browser-supplied community ID.
 */
export async function getCurrentCommunity(): Promise<Community | null> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(COMMUNITY_SUBDOMAIN_HEADER);

  if (fromHeader) {
    return getPublicCommunityBySubdomain(fromHeader);
  }

  const host = headerStore.get("host") ?? "";
  const parsed = parseHostname(host, env.NEXT_PUBLIC_ROOT_DOMAIN);
  if (parsed.kind !== "community" || !parsed.subdomain) {
    return null;
  }

  return getPublicCommunityBySubdomain(parsed.subdomain);
}

export async function requireCurrentCommunity(): Promise<Community> {
  const community = await getCurrentCommunity();
  if (!community) {
    throw new Error("Community context is required for this request.");
  }
  return community;
}
