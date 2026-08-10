import "server-only";

import type { Community, CommunityType, CountryCode, MarketStatus } from "@/types/community";
import type { Database } from "@/types/database";

type CommunityRow = Database["public"]["Tables"]["communities"]["Row"];
type CountryRow = Database["public"]["Tables"]["countries"]["Row"];
type RegionRow = Database["public"]["Tables"]["administrative_regions"]["Row"];

export type CommunityRecord = CommunityRow & {
  countries: CountryRow;
  administrative_regions: RegionRow;
};

export function mapCommunityRecord(row: CommunityRecord): Community {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    subdomain: row.subdomain,
    slug: row.slug,
    communityType: row.community_type as CommunityType,
    timezone: row.timezone,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    population: row.population,
    marketStatus: row.market_status as MarketStatus,
    isPublic: row.is_public,
    launchedAt: row.launched_at,
    country: {
      id: row.countries.id,
      isoCode: row.countries.iso_code as CountryCode,
      name: row.countries.name,
      currencyCode: row.countries.currency_code,
      defaultLocale: row.countries.default_locale,
    },
    region: {
      id: row.administrative_regions.id,
      code: row.administrative_regions.code,
      name: row.administrative_regions.name,
      regionType: row.administrative_regions.region_type,
    },
  };
}

export function toCommunitySummary(community: Community) {
  return {
    id: community.id,
    name: community.name,
    displayName: community.displayName,
    subdomain: community.subdomain,
    slug: community.slug,
    marketStatus: community.marketStatus,
    isPublic: community.isPublic,
  };
}
