import { PILOT_COMMUNITIES } from "@/lib/communities/pilot-catalog";
import { pilotUuid } from "@/lib/pilot/ids";
import type { Campaign, PublicCampaignCategory } from "@/types/campaign";
import type { PublicBusinessListing } from "@/types/business";

type PilotCategoryDef = {
  groupName: string;
  groupSlug: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
};

const PILOT_CATEGORY_DEFS: PilotCategoryDef[] = [
  {
    groupName: "Food and Drink",
    groupSlug: "food-and-drink",
    name: "Best Casual Dining",
    slug: "casual-dining",
    description: "Favourite casual restaurants in your community.",
    displayOrder: 20,
  },
  {
    groupName: "Food and Drink",
    groupSlug: "food-and-drink",
    name: "Best Pizza",
    slug: "pizza",
    description: "Best pizza in your community.",
    displayOrder: 50,
  },
  {
    groupName: "Food and Drink",
    groupSlug: "food-and-drink",
    name: "Best Coffee Shop",
    slug: "coffee-shop",
    description: "Best coffee shop in your community.",
    displayOrder: 70,
  },
  {
    groupName: "Food and Drink",
    groupSlug: "food-and-drink",
    name: "Best Bakery",
    slug: "bakery",
    description: "Best bakery in your community.",
    displayOrder: 80,
  },
  {
    groupName: "Beauty and Wellness",
    groupSlug: "beauty-and-wellness",
    name: "Best Hair Salon",
    slug: "hair-salon",
    description: "Best hair salon in your community.",
    displayOrder: 10,
  },
  {
    groupName: "Beauty and Wellness",
    groupSlug: "beauty-and-wellness",
    name: "Best Barber Shop",
    slug: "barber-shop",
    description: "Best barber shop in your community.",
    displayOrder: 20,
  },
  {
    groupName: "Automotive",
    groupSlug: "automotive",
    name: "Best Auto Repair Shop",
    slug: "auto-repair-shop",
    description: "Best auto repair shop in your community.",
    displayOrder: 30,
  },
  {
    groupName: "Shopping",
    groupSlug: "shopping",
    name: "Best Clothing Boutique",
    slug: "clothing-boutique",
    description: "Best clothing boutique in your community.",
    displayOrder: 10,
  },
  {
    groupName: "Home and Contractors",
    groupSlug: "home-and-contractors",
    name: "Best Plumber",
    slug: "plumber",
    description: "Best plumber in your community.",
    displayOrder: 10,
  },
  {
    groupName: "Pets",
    groupSlug: "pets",
    name: "Best Pet Store",
    slug: "pet-store",
    description: "Best pet store in your community.",
    displayOrder: 10,
  },
];

const BUSINESS_BY_CATEGORY: Record<string, string[]> = {
  "casual-dining": ["Main Street Kitchen", "Harbour Table", "The Local Plate"],
  pizza: ["Fire Oven Pizza", "Neighbourhood Slice", "Corner Pie Co."],
  "coffee-shop": ["Daily Grind Cafe", "River Roasters", "Northside Coffee"],
  bakery: ["Morning Crust Bakery", "Sweet Rise", "Oven & Oak"],
  "hair-salon": ["Studio Cut", "Lumen Hair", "Crown & Comb"],
  "barber-shop": ["Classic Fade Barbers", "Union Street Cuts", "Sharp & Co."],
  "auto-repair-shop": ["Reliable Auto Care", "City Garage", "Torque & Tune"],
  "clothing-boutique": ["Thread & Co.", "Market Lane Boutique", "Willow & Pine"],
  plumber: ["True North Plumbing", "PipeWorks Local", "Clearflow Plumbing"],
  "pet-store": ["Paws & Provisions", "Happy Tails Supply", "Bark Avenue"],
};

function openNominationWindow() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return {
    nominationOpensAt: new Date(now - 7 * day).toISOString(),
    nominationClosesAt: new Date(now + 21 * day).toISOString(),
    finalistReviewClosesAt: new Date(now + 35 * day).toISOString(),
    votingOpensAt: new Date(now + 36 * day).toISOString(),
    votingClosesAt: new Date(now + 57 * day).toISOString(),
    resultsPublishAt: new Date(now + 67 * day).toISOString(),
  };
}

export function getPilotCampaignForCommunity(communityId: string): Campaign | null {
  const community = PILOT_COMMUNITIES.find((item) => item.id === communityId);
  if (!community) {
    return null;
  }

  const window = openNominationWindow();
  return {
    id: pilotUuid(`campaign:${community.subdomain}:2026`),
    communityId: community.id,
    campaignTemplateId: pilotUuid("template:standard"),
    year: 2026,
    name: `${community.name} Locals Choice Awards 2026`,
    status: "nominations_open",
    ...window,
    timezone: community.timezone,
    exactVoteTotalsPublic: false,
    votingLockedAt: null,
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    archivedAt: null,
    createdAt: "2026-03-25T00:00:00.000Z",
    updatedAt: "2026-03-25T00:00:00.000Z",
  };
}

export function listPilotPublicCategories(campaign: Campaign): PublicCampaignCategory[] {
  if (!campaign.communityId.startsWith("pilot-")) {
    return [];
  }

  return PILOT_CATEGORY_DEFS.map((def) => ({
    id: pilotUuid(`category:${campaign.id}:${def.slug}`),
    campaignId: campaign.id,
    masterCategoryId: pilotUuid(`master:${def.slug}`),
    localName: null,
    localSlug: null,
    localDescription: null,
    finalistLimit: 5,
    minimumNominationCount: 3,
    active: true,
    displayOrder: def.displayOrder,
    displayName: def.name,
    displaySlug: def.slug,
    displayDescription: def.description,
    masterName: def.name,
    masterSlug: def.slug,
    groupName: def.groupName,
    groupSlug: def.groupSlug,
  }));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function listPilotBusinessesForCategory(input: {
  communityId: string;
  categorySlug: string;
  limit?: number;
}): PublicBusinessListing[] {
  const community = PILOT_COMMUNITIES.find((item) => item.id === input.communityId);
  if (!community) {
    return [];
  }

  const campaign = getPilotCampaignForCommunity(community.id);
  if (!campaign) {
    return [];
  }

  const category = listPilotPublicCategories(campaign).find(
    (item) => item.displaySlug === input.categorySlug,
  );
  if (!category) {
    return [];
  }

  const names = BUSINESS_BY_CATEGORY[input.categorySlug] ?? [];
  const limit = input.limit ?? 48;
  const now = "2026-03-25T00:00:00.000Z";

  return names.slice(0, limit).map((name) => {
    const publicName = `${community.name} ${name}`;
    const businessSlug = slugify(`${community.subdomain}-${name}`);
    const businessId = pilotUuid(`business:${community.subdomain}:${businessSlug}`);
    const locationId = pilotUuid(`location:${community.subdomain}:${businessSlug}`);
    const emailLocal = slugify(name).replace(/-/g, "");

    return {
      business: {
        id: businessId,
        legalName: publicName,
        publicName,
        slug: businessSlug,
        description: `${publicName} — a local favourite for ${category.displayName}.`,
        websiteUrl: `https://example.com/${businessSlug}`,
        primaryPhone: null,
        primaryEmail: `${emailLocal}@example.com`,
        logoUrl: null,
        status: "approved",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      location: {
        id: locationId,
        businessId,
        communityId: community.id,
        locationName: publicName,
        slug: "main",
        addressLine1: "100 Main Street",
        addressLine2: null,
        city: community.name,
        administrativeRegionCode: community.region.code,
        countryCode: community.country.isoCode === "US" ? "US" : "CA",
        postalCode: null,
        latitude: community.latitude,
        longitude: community.longitude,
        phone: null,
        email: `${emailLocal}@example.com`,
        websiteUrl: `https://example.com/${businessSlug}`,
        serviceAreaBusiness: false,
        active: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      categories: [
        {
          id: category.id,
          name: category.displayName,
          slug: category.displaySlug,
          groupName: category.groupName,
        },
      ],
    };
  });
}

export function getPilotCategoryBySlug(
  campaign: Campaign,
  categorySlug: string,
): PublicCampaignCategory | null {
  return (
    listPilotPublicCategories(campaign).find((item) => item.displaySlug === categorySlug) ?? null
  );
}

export function findPilotListingByLocationId(
  communityId: string,
  locationId: string,
): PublicBusinessListing | null {
  const campaign = getPilotCampaignForCommunity(communityId);
  if (!campaign) {
    return null;
  }

  for (const category of listPilotPublicCategories(campaign)) {
    const match = listPilotBusinessesForCategory({
      communityId,
      categorySlug: category.displaySlug,
    }).find((listing) => listing.location.id === locationId);
    if (match) {
      return match;
    }
  }

  return null;
}
