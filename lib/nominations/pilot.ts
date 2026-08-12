import "server-only";

import {
  sendBusinessNominatedEmail,
  sendNominationReceivedEmail,
} from "@/lib/email/nominations";
import {
  findPilotListingByLocationId,
  getPilotCampaignForCommunity,
  getPilotCategoryBySlug,
  listPilotPublicCategories,
} from "@/lib/pilot/directory-catalog";
import { pilotUuid } from "@/lib/pilot/ids";
import type { PublicBusinessListing } from "@/types/business";
import type { NominationStatus } from "@/types/nomination";

export type PilotNominationResult =
  | {
      ok: true;
      nominationId: string;
      status: NominationStatus;
      listing?: PublicBusinessListing;
    }
  | { ok: false; message: string };

export async function createPilotNomination(input: {
  communityId: string;
  communityName: string;
  userId: string;
  email: string;
  campaignCategoryId: string;
  businessLocationId: string;
  businessEmail?: string | null;
}): Promise<PilotNominationResult> {
  const campaign = getPilotCampaignForCommunity(input.communityId);
  if (!campaign) {
    return { ok: false, message: "No pilot campaign is available." };
  }

  const category =
    listPilotPublicCategories(campaign).find((item) => item.id === input.campaignCategoryId) ??
    null;
  if (!category) {
    return { ok: false, message: "Category not found." };
  }

  const listing = findPilotListingByLocationId(input.communityId, input.businessLocationId);
  if (!listing) {
    return { ok: false, message: "Business not found in this community." };
  }

  const nominationId = pilotUuid(
    `nomination:${input.userId}:${input.campaignCategoryId}:${input.businessLocationId}:${Date.now()}`,
  );
  const businessEmail =
    input.businessEmail?.trim() ||
    listing.location.email ||
    listing.business.primaryEmail ||
    null;

  await sendNominationReceivedEmail({
    to: input.email,
    userId: input.userId,
    businessName: listing.business.publicName,
    categoryName: category.displayName,
    nominationId,
    communityName: input.communityName,
  });

  if (businessEmail) {
    await sendBusinessNominatedEmail({
      to: businessEmail,
      businessName: listing.business.publicName,
      categoryName: category.displayName,
      nominationId,
      communityName: input.communityName,
    });
  }

  return { ok: true, nominationId, status: "valid" };
}

export async function createPilotMissingBusinessNomination(input: {
  communityId: string;
  communityName: string;
  userId: string;
  email: string;
  campaignCategoryId: string;
  businessName: string;
  address?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  businessEmail: string;
}): Promise<PilotNominationResult> {
  const campaign = getPilotCampaignForCommunity(input.communityId);
  if (!campaign) {
    return { ok: false, message: "No pilot campaign is available." };
  }

  const category =
    listPilotPublicCategories(campaign).find((item) => item.id === input.campaignCategoryId) ??
    null;
  if (!category) {
    return { ok: false, message: "Category not found." };
  }

  const nominationId = pilotUuid(
    `nomination-new:${input.userId}:${input.campaignCategoryId}:${input.businessName}:${Date.now()}`,
  );
  const businessSlug = input.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const businessId = pilotUuid(`nominated-business:${nominationId}`);
  const locationId = pilotUuid(`nominated-location:${nominationId}`);
  const now = new Date().toISOString();

  const listing: PublicBusinessListing = {
    business: {
      id: businessId,
      legalName: input.businessName,
      publicName: input.businessName,
      slug: businessSlug || "nominated-business",
      description: "",
      websiteUrl: input.websiteUrl || null,
      primaryPhone: input.phone || null,
      primaryEmail: input.businessEmail,
      logoUrl: null,
      status: "approved",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    location: {
      id: locationId,
      businessId,
      communityId: input.communityId,
      locationName: input.businessName,
      slug: "main",
      addressLine1: input.address || null,
      addressLine2: null,
      city: input.communityName,
      administrativeRegionCode: null,
      countryCode: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      phone: input.phone || null,
      email: input.businessEmail,
      websiteUrl: input.websiteUrl || null,
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

  await sendNominationReceivedEmail({
    to: input.email,
    userId: input.userId,
    businessName: input.businessName,
    categoryName: category.displayName,
    nominationId,
    communityName: input.communityName,
  });

  await sendBusinessNominatedEmail({
    to: input.businessEmail,
    businessName: input.businessName,
    categoryName: category.displayName,
    nominationId,
    communityName: input.communityName,
  });

  return { ok: true, nominationId, status: "valid", listing };
}

export function resolvePilotCategorySlug(campaignCategoryId: string, communityId: string) {
  const campaign = getPilotCampaignForCommunity(communityId);
  if (!campaign) {
    return null;
  }
  return listPilotPublicCategories(campaign).find((item) => item.id === campaignCategoryId) ?? null;
}

export { getPilotCategoryBySlug };
