import type { Community } from "@/types/community";

/**
 * Temporary in-app pilot catalog so hostname demos and tests work before a live
 * Supabase project is linked. Database rows from the seed migration remain authoritative
 * when available.
 */
export const PILOT_COMMUNITIES: Community[] = [
  {
    id: "pilot-saultstemarie",
    name: "Sault Ste. Marie",
    displayName: "Sault Ste. Marie Locals Choice Awards",
    subdomain: "saultstemarie",
    slug: "sault-ste-marie",
    communityType: "city",
    timezone: "America/Toronto",
    latitude: 46.5219,
    longitude: -84.3461,
    population: 72000,
    marketStatus: "preparing",
    isPublic: true,
    launchedAt: "2026-03-25T00:00:00.000Z",
    country: {
      id: "pilot-ca",
      isoCode: "CA",
      name: "Canada",
      currencyCode: "CAD",
      defaultLocale: "en-CA",
    },
    region: {
      id: "pilot-on",
      code: "ON",
      name: "Ontario",
      regionType: "province",
    },
  },
  {
    id: "pilot-sudbury",
    name: "Greater Sudbury",
    displayName: "Greater Sudbury Locals Choice Awards",
    subdomain: "sudbury",
    slug: "greater-sudbury",
    communityType: "city",
    timezone: "America/Toronto",
    latitude: 46.4917,
    longitude: -80.993,
    population: 166000,
    marketStatus: "preparing",
    isPublic: true,
    launchedAt: "2026-03-25T00:00:00.000Z",
    country: {
      id: "pilot-ca",
      isoCode: "CA",
      name: "Canada",
      currencyCode: "CAD",
      defaultLocale: "en-CA",
    },
    region: {
      id: "pilot-on",
      code: "ON",
      name: "Ontario",
      regionType: "province",
    },
  },
  {
    id: "pilot-winnipeg",
    name: "Winnipeg",
    displayName: "Winnipeg Locals Choice Awards",
    subdomain: "winnipeg",
    slug: "winnipeg",
    communityType: "city",
    timezone: "America/Winnipeg",
    latitude: 49.8951,
    longitude: -97.1384,
    population: 750000,
    marketStatus: "planned",
    isPublic: true,
    launchedAt: null,
    country: {
      id: "pilot-ca",
      isoCode: "CA",
      name: "Canada",
      currencyCode: "CAD",
      defaultLocale: "en-CA",
    },
    region: {
      id: "pilot-mb",
      code: "MB",
      name: "Manitoba",
      regionType: "province",
    },
  },
  {
    id: "pilot-marquette",
    name: "Marquette",
    displayName: "Marquette Locals Choice Awards",
    subdomain: "marquette",
    slug: "marquette",
    communityType: "city",
    timezone: "America/Detroit",
    latitude: 46.5436,
    longitude: -87.3954,
    population: 21000,
    marketStatus: "planned",
    isPublic: true,
    launchedAt: null,
    country: {
      id: "pilot-us",
      isoCode: "US",
      name: "United States",
      currencyCode: "USD",
      defaultLocale: "en-US",
    },
    region: {
      id: "pilot-mi",
      code: "MI",
      name: "Michigan",
      regionType: "state",
    },
  },
  {
    id: "pilot-detroit",
    name: "Detroit",
    displayName: "Detroit Locals Choice Awards",
    subdomain: "detroit",
    slug: "detroit",
    communityType: "city",
    timezone: "America/Detroit",
    latitude: 42.3314,
    longitude: -83.0458,
    population: 630000,
    marketStatus: "preparing",
    isPublic: true,
    launchedAt: "2026-03-25T00:00:00.000Z",
    country: {
      id: "pilot-us",
      isoCode: "US",
      name: "United States",
      currencyCode: "USD",
      defaultLocale: "en-US",
    },
    region: {
      id: "pilot-mi",
      code: "MI",
      name: "Michigan",
      regionType: "state",
    },
  },
];

const PILOT_ALIASES: Record<string, string[]> = {
  saultstemarie: ["Sault Ste Marie", "The Soo", "Soo"],
  sudbury: ["Sudbury", "Sudbury City"],
  winnipeg: ["Peg"],
  detroit: ["Motor City"],
  marquette: [],
};

export function getPilotCommunityBySubdomain(subdomain: string): Community | null {
  const normalized = subdomain.trim().toLowerCase();
  return PILOT_COMMUNITIES.find((community) => community.subdomain === normalized) ?? null;
}

export function getPilotCommunityAliases(subdomain: string): string[] {
  return PILOT_ALIASES[subdomain.trim().toLowerCase()] ?? [];
}
