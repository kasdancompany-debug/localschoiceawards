import "server-only";

import { withSoftTimeout } from "@/lib/async/soft-timeout";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import {
  filterLocationsForCommunity,
  findDuplicateCandidates,
  normalizeAddressKey,
  normalizeBusinessText,
  normalizePhoneDigits,
  normalizeWebsiteDomain,
  ensureUniqueBusinessSlug as buildUniqueBusinessSlug,
  type DuplicateProbe,
} from "@/lib/businesses/duplicates";
import {
  mapBusiness,
  mapBusinessHours,
  mapBusinessLocation,
  mapBusinessMedia,
  mapBusinessSocialLink,
  type BusinessLocationRow,
  type BusinessRow,
} from "@/lib/businesses/mappers";
import type {
  Business,
  DuplicateCandidate,
  PublicBusinessListing,
  PublicBusinessProfile,
} from "@/types/business";

async function loadDuplicateProbes(communityId?: string): Promise<DuplicateProbe[]> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("business_locations")
      .select(
        `
        id,
        community_id,
        location_name,
        slug,
        phone,
        website_url,
        address_line_1,
        address_line_2,
        city,
        administrative_region_code,
        postal_code,
        country_code,
        businesses!inner (
          id,
          public_name,
          slug,
          primary_phone,
          website_url,
          status,
          deleted_at
        )
      `,
      )
      .is("deleted_at", null)
      .eq("active", true);

    if (communityId) {
      query = query.eq("community_id", communityId);
    }

    const result = await withSoftTimeout(Promise.resolve(query), {
      data: null,
      error: null,
      count: null,
      status: 0,
      statusText: "",
    } as never);

    if (!result.data) {
      return [];
    }

    return result.data.flatMap((row: Record<string, unknown>) => {
      const businessRaw = row.businesses;
      if (!businessRaw || typeof businessRaw !== "object") {
        return [];
      }
      const business = businessRaw as {
        id: string;
        public_name: string;
        slug: string;
        primary_phone: string | null;
        website_url: string | null;
        deleted_at: string | null;
      };
      if (business.deleted_at) {
        return [];
      }

      return [
        {
          id: business.id,
          locationId: String(row.id),
          publicName: business.public_name,
          slug: business.slug,
          communityId: String(row.community_id),
          normalizedName: normalizeBusinessText(business.public_name),
          normalizedPhone:
            normalizePhoneDigits(String(row.phone ?? "")) ??
            normalizePhoneDigits(business.primary_phone),
          normalizedWebsiteDomain:
            normalizeWebsiteDomain(String(row.website_url ?? "")) ??
            normalizeWebsiteDomain(business.website_url),
          normalizedAddress: normalizeAddressKey({
            addressLine1: row.address_line_1 as string | null,
            addressLine2: row.address_line_2 as string | null,
            city: row.city as string | null,
            administrativeRegionCode: row.administrative_region_code as string | null,
            postalCode: row.postal_code as string | null,
            countryCode: row.country_code as string | null,
          }),
        },
      ];
    });
  } catch {
    return [];
  }
}

export async function detectBusinessDuplicates(
  incoming: {
    publicName: string;
    phone?: string | null;
    websiteUrl?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    administrativeRegionCode?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
  },
  communityId?: string,
): Promise<DuplicateCandidate[]> {
  const probes = await loadDuplicateProbes(communityId);
  return findDuplicateCandidates(incoming, probes, { communityId });
}

export async function getPublicBusinessBySlug(
  slug: string,
  communityId: string,
): Promise<PublicBusinessProfile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const businessResult = await withSoftTimeout(
      Promise.resolve(
        supabase
          .from("businesses")
          .select("*")
          .eq("slug", slug.toLowerCase())
          .eq("status", "approved")
          .is("deleted_at", null)
          .maybeSingle(),
      ),
      { data: null, error: null } as never,
    );

    if (!businessResult.data) {
      return null;
    }

    const business = mapBusiness(businessResult.data as BusinessRow);
    const locationsResult = await withSoftTimeout(
      Promise.resolve(
        supabase
          .from("business_locations")
          .select("*")
          .eq("business_id", business.id)
          .eq("community_id", communityId)
          .eq("active", true)
          .is("deleted_at", null),
      ),
      { data: [], error: null } as never,
    );

    const locations = filterLocationsForCommunity(
      ((locationsResult.data as BusinessLocationRow[] | null) ?? []).map(mapBusinessLocation),
      communityId,
    );

    if (locations.length === 0) {
      return null;
    }

    const locationIds = locations.map((location) => location.id);
    const [hoursResult, socialResult, mediaResult, assignmentResult] = await Promise.all([
      withSoftTimeout(
        Promise.resolve(
          supabase.from("business_hours").select("*").in("business_location_id", locationIds),
        ),
        { data: [], error: null } as never,
      ),
      withSoftTimeout(
        Promise.resolve(
          supabase.from("business_social_links").select("*").eq("business_id", business.id),
        ),
        { data: [], error: null } as never,
      ),
      withSoftTimeout(
        Promise.resolve(
          supabase
            .from("business_media")
            .select("*")
            .eq("business_id", business.id)
            .eq("approved", true)
            .order("display_order"),
        ),
        { data: [], error: null } as never,
      ),
      withSoftTimeout(
        Promise.resolve(
          supabase
            .from("business_category_assignments")
            .select(
              `
              id,
              business_location_id,
              campaign_category_id,
              status,
              campaign_categories!inner (
                id,
                local_name,
                local_slug,
                master_categories!inner (
                  name,
                  slug,
                  category_groups!inner ( name )
                )
              )
            `,
            )
            .in("business_location_id", locationIds)
            .eq("status", "approved"),
        ),
        { data: [], error: null } as never,
      ),
    ]);

    const hoursByLocationId: PublicBusinessProfile["hoursByLocationId"] = {};
    for (const row of hoursResult.data ?? []) {
      const mapped = mapBusinessHours(row);
      const list = hoursByLocationId[mapped.businessLocationId] ?? [];
      list.push(mapped);
      hoursByLocationId[mapped.businessLocationId] = list;
    }

    const categories = (assignmentResult.data ?? []).flatMap(
      (row: {
        business_location_id: string;
        campaign_categories: unknown;
      }) => {
        const categoryRaw = row.campaign_categories;
        if (!categoryRaw || typeof categoryRaw !== "object") {
          return [];
        }
        const category = categoryRaw as {
          id: string;
          local_name: string | null;
          local_slug: string | null;
          master_categories: {
            name: string;
            slug: string;
            category_groups: { name: string };
          };
        };
        return [
          {
            id: category.id,
            name: category.local_name || category.master_categories.name,
            slug: category.local_slug || category.master_categories.slug,
            groupName: category.master_categories.category_groups.name,
            locationId: row.business_location_id,
          },
        ];
      },
    );

    return {
      business,
      locations,
      hoursByLocationId,
      socialLinks: (socialResult.data ?? []).map(mapBusinessSocialLink),
      media: (mediaResult.data ?? []).map(mapBusinessMedia),
      categories,
    };
  } catch {
    return null;
  }
}

export async function searchPublicBusinessesInCommunity(input: {
  communityId: string;
  query?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<PublicBusinessListing[]> {
  const limit = input.limit ?? 24;
  try {
    const supabase = await createSupabaseServerClient();
    const result = await withSoftTimeout(
      Promise.resolve(
        supabase
          .from("business_locations")
          .select(
            `
            *,
            businesses!inner (*)
          `,
          )
          .eq("community_id", input.communityId)
          .eq("active", true)
          .is("deleted_at", null)
          .eq("businesses.status", "approved")
          .is("businesses.deleted_at", null)
          .limit(Math.max(limit * 3, 48)),
      ),
      { data: [], error: null } as never,
    );

    const rows = result.data ?? [];
    const listings: PublicBusinessListing[] = [];

    for (const row of rows) {
      const businessRaw = row.businesses as unknown;
      if (!businessRaw || typeof businessRaw !== "object") {
        continue;
      }
      const business = mapBusiness(businessRaw as BusinessRow);
      const location = mapBusinessLocation(row as BusinessLocationRow);

      const assignmentResult = await withSoftTimeout(
        Promise.resolve(
          supabase
            .from("business_category_assignments")
            .select(
              `
              status,
              campaign_categories!inner (
                id,
                local_name,
                local_slug,
                master_categories!inner (
                  name,
                  slug,
                  category_groups!inner ( name )
                )
              )
            `,
            )
            .eq("business_location_id", location.id)
            .eq("status", "approved"),
        ),
        { data: [], error: null } as never,
      );

      const categories = (assignmentResult.data ?? []).flatMap(
        (assignment: { campaign_categories: unknown }) => {
          const categoryRaw = assignment.campaign_categories;
          if (!categoryRaw || typeof categoryRaw !== "object") {
            return [];
          }
          const category = categoryRaw as {
            id: string;
            local_name: string | null;
            local_slug: string | null;
            master_categories: {
              name: string;
              slug: string;
              category_groups: { name: string };
            };
          };
          const categorySlug = category.local_slug || category.master_categories.slug;
          if (input.categorySlug && categorySlug !== input.categorySlug) {
            return [];
          }
          return [
            {
              id: category.id,
              name: category.local_name || category.master_categories.name,
              slug: categorySlug,
              groupName: category.master_categories.category_groups.name,
            },
          ];
        },
      );

      if (input.categorySlug && categories.length === 0) {
        continue;
      }

      listings.push({ business, location, categories });
    }

    let filtered = listings;
    if (input.query?.trim()) {
      const needle = normalizeBusinessText(input.query);
      filtered = listings.filter((listing) => {
        const haystack = normalizeBusinessText(
          `${listing.business.publicName} ${listing.location.locationName} ${listing.categories
            .map((category) => `${category.name} ${category.groupName}`)
            .join(" ")}`,
        );
        return haystack.includes(needle);
      });
    }

    return filtered.slice(0, limit);
  } catch {
    return [];
  }
}

export async function listBusinessesForCategory(input: {
  communityId: string;
  categorySlug: string;
  limit?: number;
}): Promise<PublicBusinessListing[]> {
  return searchPublicBusinessesInCommunity({
    communityId: input.communityId,
    categorySlug: input.categorySlug,
    limit: input.limit ?? 48,
  });
}

export async function createMissingBusinessSubmission(input: {
  campaignId: string;
  submittedByUserId?: string | null;
  businessName: string;
  categoryId?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  submitterEmail: string;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("business_submission_requests")
      .insert({
        campaign_id: input.campaignId,
        submitted_by_user_id: input.submittedByUserId ?? null,
        business_name: input.businessName,
        category_id: input.categoryId || null,
        address: input.address || null,
        website_url: input.websiteUrl || null,
        phone: input.phone || null,
        submitter_email: input.submitterEmail,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (error || !data?.id) {
      return { ok: false, message: "Unable to save submission. Please try again." };
    }
    return { ok: true, id: data.id, message: "Submission received for review." };
  } catch {
    return { ok: false, message: "Unable to save submission. Please try again." };
  }
}

export function ensureUniqueBusinessSlug(desired: string, existingSlugs: Set<string>): string {
  return buildUniqueBusinessSlug(desired, existingSlugs);
}

export async function softDeleteBusiness(businessId: string): Promise<Business | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("businesses")
    .update({ deleted_at: new Date().toISOString(), status: "suspended" })
    .eq("id", businessId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return mapBusiness(data as BusinessRow);
}
