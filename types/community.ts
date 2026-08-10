export const MARKET_STATUSES = [
  "planned",
  "preparing",
  "nominations",
  "voting",
  "auditing",
  "results",
  "archived",
  "paused",
] as const;

export type MarketStatus = (typeof MARKET_STATUSES)[number];

export const COMMUNITY_TYPES = [
  "city",
  "town",
  "township",
  "village",
  "municipality",
  "county",
  "region",
  "district",
  "borough",
  "neighbourhood",
  "metro",
  "association",
] as const;

export type CommunityType = (typeof COMMUNITY_TYPES)[number];

export type CountryCode = "CA" | "US";

export type CommunityCountry = {
  id: string;
  isoCode: CountryCode;
  name: string;
  currencyCode: "CAD" | "USD";
  defaultLocale: string;
};

export type CommunityRegion = {
  id: string;
  code: string;
  name: string;
  regionType: "province" | "territory" | "state" | "district";
};

export type Community = {
  id: string;
  name: string;
  displayName: string;
  subdomain: string;
  slug: string;
  communityType: CommunityType;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  marketStatus: MarketStatus;
  isPublic: boolean;
  launchedAt: string | null;
  country: CommunityCountry;
  region: CommunityRegion;
};

export type CommunitySummary = Pick<
  Community,
  "id" | "name" | "displayName" | "subdomain" | "slug" | "marketStatus" | "isPublic"
>;

export function isCommunityPubliclyAvailable(community: Pick<Community, "isPublic" | "marketStatus">): boolean {
  return community.isPublic && community.marketStatus !== "archived";
}
