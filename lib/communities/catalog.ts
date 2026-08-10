import "server-only";

import { withSoftTimeout } from "@/lib/async/soft-timeout";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { buildCommunityHostname } from "@/lib/communities/hostname";
import { mapCommunityRecord, type CommunityRecord } from "@/lib/communities/mappers";
import {
  getPilotCommunityAliases,
  PILOT_COMMUNITIES,
} from "@/lib/communities/pilot-catalog";
import {
  isCommunityMarketActive,
  type CommunitySearchRecord,
} from "@/lib/communities/search";
import { env } from "@/lib/env/server";
import { isCommunityPubliclyAvailable, type Community } from "@/types/community";

const COMMUNITY_SELECT = `
  id,
  country_id,
  administrative_region_id,
  name,
  display_name,
  subdomain,
  slug,
  community_type,
  timezone,
  latitude,
  longitude,
  population,
  market_status,
  is_public,
  launched_at,
  created_at,
  updated_at,
  countries!inner (
    id,
    iso_code,
    name,
    currency_code,
    default_locale,
    active,
    created_at,
    updated_at
  ),
  administrative_regions!inner (
    id,
    country_id,
    code,
    name,
    region_type,
    active,
    created_at,
    updated_at
  )
`;

function allowPilotCatalogFallback(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.USE_PILOT_COMMUNITY_CATALOG === "true"
  );
}

function communityUrl(community: Community): string | null {
  if (!isCommunityMarketActive(community.marketStatus)) {
    return null;
  }
  const root = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const protocol = root.includes("localhost") ? "http" : "https";
  return buildCommunityHostname(community.subdomain, root, protocol);
}

export function toCommunitySearchRecord(
  community: Community,
  aliases: string[] = [],
): CommunitySearchRecord {
  const isActive = isCommunityMarketActive(community.marketStatus);
  return {
    id: community.id,
    name: community.name,
    displayName: community.displayName,
    subdomain: community.subdomain,
    slug: community.slug,
    marketStatus: community.marketStatus,
    isActive,
    countryCode: community.country.isoCode,
    countryName: community.country.name,
    regionCode: community.region.code,
    regionName: community.region.name,
    regionType: community.region.regionType,
    aliases,
    url: isActive ? communityUrl(community) : null,
  };
}

async function listAliasesByCommunityId(
  communityIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (communityIds.length === 0) {
    return map;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("community_aliases")
      .select("community_id, alias")
      .in("community_id", communityIds);

    if (error || !data) {
      return map;
    }

    for (const row of data) {
      const list = map.get(row.community_id) ?? [];
      list.push(row.alias);
      map.set(row.community_id, list);
    }
  } catch {
    // Fall through with empty aliases.
  }

  return map;
}

async function listPublicCommunitiesFromDatabase(): Promise<CommunitySearchRecord[] | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const query = supabase
      .from("communities")
      .select(COMMUNITY_SELECT)
      .eq("is_public", true)
      .neq("market_status", "archived")
      .order("name");

    const { data, error } = await withSoftTimeout(
      query,
      { data: null, error: null } as unknown as Awaited<typeof query>,
    );

    if (error || !data || data.length === 0) {
      return null;
    }

    const communities = data.flatMap((row) => {
      const record = row as unknown as CommunityRecord;
      const community = mapCommunityRecord(record);
      return isCommunityPubliclyAvailable(community) ? [community] : [];
    });

    const aliases = await listAliasesByCommunityId(communities.map((c) => c.id));
    return communities.map((community) =>
      toCommunitySearchRecord(community, aliases.get(community.id) ?? []),
    );
  } catch {
    return null;
  }
}

function listPilotSearchRecords(): CommunitySearchRecord[] {
  return PILOT_COMMUNITIES.filter(isCommunityPubliclyAvailable).map((community) =>
    toCommunitySearchRecord(community, getPilotCommunityAliases(community.subdomain)),
  );
}

/**
 * Public searchable community catalog for discovery UI.
 * Prefer live Supabase rows; fall back to the pilot catalog in local/demo environments.
 */
export async function listPublicCommunitySearchRecords(): Promise<CommunitySearchRecord[]> {
  const fromDb = await listPublicCommunitiesFromDatabase();
  if (fromDb && fromDb.length > 0) {
    return fromDb;
  }
  if (allowPilotCatalogFallback()) {
    return listPilotSearchRecords();
  }
  return [];
}
