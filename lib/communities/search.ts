import type { Community, CountryCode, MarketStatus } from "@/types/community";

export type CommunitySearchRecord = {
  id: string;
  name: string;
  displayName: string;
  subdomain: string;
  slug: string;
  marketStatus: MarketStatus;
  /** False when the market is still planned (Coming Soon). */
  isActive: boolean;
  countryCode: CountryCode;
  countryName: string;
  regionCode: string;
  regionName: string;
  regionType: Community["region"]["regionType"];
  aliases: string[];
  /** Absolute community homepage URL when active; null for planned. */
  url: string | null;
};

export type CommunityRegionGroup = {
  countryCode: CountryCode;
  countryName: string;
  regionCode: string;
  regionName: string;
  regionType: Community["region"]["regionType"];
  communities: CommunitySearchRecord[];
};

/**
 * Punctuation-insensitive, case-insensitive search text.
 * Keeps alphanumeric runs so "Sault Ste. Marie" matches "saultstemarie".
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactSearchText(input: string): string {
  return normalizeSearchText(input).replace(/\s+/g, "");
}

export function isCommunityMarketActive(status: MarketStatus): boolean {
  return status !== "planned";
}

function recordMatchesQuery(record: CommunitySearchRecord, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  const compactQuery = compactSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [
    record.name,
    record.displayName,
    record.subdomain,
    record.slug,
    record.regionName,
    record.regionCode,
    record.countryName,
    ...record.aliases,
  ];

  return haystacks.some((value) => {
    const normalized = normalizeSearchText(value);
    const compact = compactSearchText(value);
    return (
      normalized.includes(normalizedQuery) ||
      compact.includes(compactQuery) ||
      normalizedQuery.split(" ").every((token) => token.length === 0 || normalized.includes(token))
    );
  });
}

export function filterCommunitySearchRecords(
  records: CommunitySearchRecord[],
  query: string,
): CommunitySearchRecord[] {
  const filtered = records.filter((record) => recordMatchesQuery(record, query));
  return sortCommunitySearchRecords(filtered);
}

/** Active communities first, then planned; alphabetical within each band. */
export function sortCommunitySearchRecords(
  records: CommunitySearchRecord[],
): CommunitySearchRecord[] {
  return [...records].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function groupCommunitiesByRegion(
  records: CommunitySearchRecord[],
): CommunityRegionGroup[] {
  const sorted = sortCommunitySearchRecords(records);
  const groups = new Map<string, CommunityRegionGroup>();

  for (const community of sorted) {
    const key = `${community.countryCode}:${community.regionCode}`;
    const existing = groups.get(key);
    if (existing) {
      existing.communities.push(community);
      continue;
    }
    groups.set(key, {
      countryCode: community.countryCode,
      countryName: community.countryName,
      regionCode: community.regionCode,
      regionName: community.regionName,
      regionType: community.regionType,
      communities: [community],
    });
  }

  return [...groups.values()].sort((a, b) => {
    if (a.countryName !== b.countryName) {
      return a.countryName.localeCompare(b.countryName);
    }
    return a.regionName.localeCompare(b.regionName);
  });
}

export function groupCommunitiesByCountry(
  groups: CommunityRegionGroup[],
): Array<{
  countryCode: CountryCode;
  countryName: string;
  regions: CommunityRegionGroup[];
}> {
  const countries = new Map<
    CountryCode,
    { countryCode: CountryCode; countryName: string; regions: CommunityRegionGroup[] }
  >();

  for (const group of groups) {
    const existing = countries.get(group.countryCode);
    if (existing) {
      existing.regions.push(group);
      continue;
    }
    countries.set(group.countryCode, {
      countryCode: group.countryCode,
      countryName: group.countryName,
      regions: [group],
    });
  }

  return [...countries.values()].sort((a, b) => a.countryName.localeCompare(b.countryName));
}
