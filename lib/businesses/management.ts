import "server-only";

import { requireBusinessMembership } from "@/lib/businesses/memberships";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import {
  updateBusinessHoursSchema,
  updateBusinessProfileSchema,
  updateBusinessSocialLinksSchema,
} from "@/lib/validation/business-access";

export async function updateManagedBusinessProfile(input: {
  userId: string;
  businessId: string;
  publicName: string;
  description: string;
  websiteUrl?: string;
  primaryPhone?: string;
}) {
  await requireBusinessMembership(input.businessId, input.userId, { edit: true });
  const parsed = updateBusinessProfileSchema.parse({
    businessId: input.businessId,
    publicName: input.publicName,
    description: input.description,
    websiteUrl: input.websiteUrl ?? "",
    primaryPhone: input.primaryPhone ?? "",
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      public_name: parsed.publicName,
      description: parsed.description,
      website_url: parsed.websiteUrl || null,
      primary_phone: parsed.primaryPhone || null,
    })
    .eq("id", parsed.businessId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function replaceBusinessHours(input: {
  userId: string;
  businessId: string;
  businessLocationId: string;
  entries: Array<{
    dayOfWeek: number;
    opensAt?: string;
    closesAt?: string;
    closed: boolean;
    appointmentOnly: boolean;
  }>;
}) {
  await requireBusinessMembership(input.businessId, input.userId, { locations: true });
  const parsed = updateBusinessHoursSchema.parse({
    businessLocationId: input.businessLocationId,
    entries: input.entries,
  });

  const supabase = await createSupabaseServerClient();
  const { data: location } = await supabase
    .from("business_locations")
    .select("id, business_id")
    .eq("id", parsed.businessLocationId)
    .maybeSingle();

  if (!location || location.business_id !== input.businessId) {
    throw new Error("Location not found for this business.");
  }

  await supabase.from("business_hours").delete().eq("business_location_id", parsed.businessLocationId);
  if (parsed.entries.length) {
    const { error } = await supabase.from("business_hours").insert(
      parsed.entries.map((entry) => ({
        business_location_id: parsed.businessLocationId,
        day_of_week: entry.dayOfWeek,
        opens_at: entry.closed ? null : entry.opensAt || null,
        closes_at: entry.closed ? null : entry.closesAt || null,
        closed: entry.closed,
        appointment_only: entry.appointmentOnly,
      })),
    );
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function replaceBusinessSocialLinks(input: {
  userId: string;
  businessId: string;
  links: Array<{ platform: string; url: string }>;
}) {
  await requireBusinessMembership(input.businessId, input.userId, { edit: true });
  const parsed = updateBusinessSocialLinksSchema.parse({
    businessId: input.businessId,
    links: input.links,
  });

  const supabase = await createSupabaseServerClient();
  await supabase.from("business_social_links").delete().eq("business_id", parsed.businessId);
  if (parsed.links.length) {
    const { error } = await supabase.from("business_social_links").insert(
      parsed.links.map((link) => ({
        business_id: parsed.businessId,
        platform: link.platform,
        url: link.url,
      })),
    );
    if (error) {
      throw new Error(error.message);
    }
  }
}
