import "server-only";

import { createApprovedBusinessFromNomination, createMissingBusinessSubmission } from "@/lib/businesses/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import {
  sendBusinessNominatedEmail,
  sendNominationReceivedEmail,
} from "@/lib/email/nominations";
import { env } from "@/lib/env/server";
import { buildCommunityHostname } from "@/lib/communities/hostname";
import {
  mapFraudSignal,
  mapNomination,
  toPublicNominationView,
} from "@/lib/nominations/mappers";
import { hashIpFingerprint, hashVerifiedEmail } from "@/lib/nominations/privacy";
import {
  evaluateNominationEligibility,
  nominationRuleMessage,
  nominationStatusForTarget,
  publicNominationPresence,
  type NominationRuleFailure,
} from "@/lib/nominations/rules";
import type { Campaign } from "@/types/campaign";
import type {
  FraudSignal,
  FraudSignalType,
  Nomination,
  NominationEventType,
  NominationStatus,
  PublicNominationView,
} from "@/types/nomination";

export { publicNominationPresence };

async function recordNominationEvent(
  nominationId: string,
  eventType: NominationEventType,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  const admin = createSupabaseAdminClient();
  await admin.from("nomination_events").insert({
    nomination_id: nominationId,
    event_type: eventType,
    metadata,
  });
}

export async function recordFraudSignal(input: {
  campaignId: string;
  entityType: FraudSignal["entityType"];
  entityId: string;
  signalType: FraudSignalType;
  riskScore: number;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("fraud_signals").insert({
      campaign_id: input.campaignId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      signal_type: input.signalType,
      risk_score: input.riskScore,
      metadata: input.metadata ?? {},
      status: "open",
    });
  } catch {
    // Fraud logging must not break primary flows.
  }
}

async function loadCategoryForCampaign(campaignId: string, campaignCategoryId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("campaign_categories")
    .select("id, campaign_id, active, local_slug, local_name, master_categories(name, slug)")
    .eq("id", campaignCategoryId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  return data;
}

async function loadBusinessLocation(locationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("business_locations")
    .select(
      `
      id,
      community_id,
      active,
      deleted_at,
      location_name,
      email,
      businesses!inner (
        id,
        public_name,
        status,
        deleted_at,
        primary_email
      )
    `,
    )
    .eq("id", locationId)
    .maybeSingle();
  return data;
}

async function hasActiveNomination(input: {
  campaignId: string;
  campaignCategoryId: string;
  userId: string;
  businessLocationId?: string | null;
  businessSubmissionRequestId?: string | null;
}): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("nominations")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", input.campaignId)
    .eq("campaign_category_id", input.campaignCategoryId)
    .eq("user_id", input.userId)
    .in("status", ["valid", "pending_business_moderation"]);

  if (input.businessLocationId) {
    query = query.eq("business_location_id", input.businessLocationId);
  } else if (input.businessSubmissionRequestId) {
    query = query.eq("business_submission_request_id", input.businessSubmissionRequestId);
  }

  const { count } = await query;
  return (count ?? 0) > 0;
}

export type CreateNominationResult =
  | { ok: true; nominationId: string; status: NominationStatus }
  | { ok: false; reason: NominationRuleFailure | "rate_limited" | "server_error"; message: string };

export async function createNomination(input: {
  campaign: Campaign;
  communityId: string;
  communityName?: string;
  userId: string;
  email: string;
  emailConfirmed: boolean;
  campaignCategoryId: string;
  businessLocationId: string;
  businessEmail?: string | null;
  ipAddress?: string | null;
}): Promise<CreateNominationResult> {
  const campaignState = resolveCampaignState(input.campaign);
  const category = await loadCategoryForCampaign(input.campaign.id, input.campaignCategoryId);
  const location = await loadBusinessLocation(input.businessLocationId);

  const business = location?.businesses as
    | {
        id: string;
        public_name: string;
        status: string;
        deleted_at: string | null;
        primary_email: string | null;
      }
    | null
    | undefined;

  const duplicate = location
    ? await hasActiveNomination({
        campaignId: input.campaign.id,
        campaignCategoryId: input.campaignCategoryId,
        userId: input.userId,
        businessLocationId: input.businessLocationId,
      })
    : false;

  const eligibility = evaluateNominationEligibility({
    emailConfirmed: input.emailConfirmed,
    campaignState,
    categoryBelongsToCampaign: Boolean(category),
    categoryActive: Boolean(category?.active),
    businessLocationInCommunity: location?.community_id === input.communityId,
    businessApproved: business?.status === "approved" && !business.deleted_at,
    businessLocationActive: Boolean(location?.active && !location.deleted_at),
    hasExistingActiveNomination: duplicate,
    hasBusinessLocation: Boolean(location),
    hasMissingBusinessSubmission: false,
  });

  if (!eligibility.ok) {
    const signalType =
      eligibility.reason === "unverified_user"
        ? "unverified_user"
        : eligibility.reason === "nominations_closed"
          ? "closed_phase_attempt"
          : eligibility.reason === "cross_community"
            ? "cross_community_attempt"
            : eligibility.reason === "duplicate_nomination"
              ? "duplicate_attempt"
              : "manual_review";

    await recordFraudSignal({
      campaignId: input.campaign.id,
      entityType: "user",
      entityId: input.userId,
      signalType,
      riskScore: eligibility.reason === "duplicate_nomination" ? 25 : 40,
      metadata: {
        reason: eligibility.reason,
        ipHash: input.ipAddress ? hashIpFingerprint(input.ipAddress) : null,
        categoryId: input.campaignCategoryId,
      },
    });

    return {
      ok: false,
      reason: eligibility.reason,
      message: nominationRuleMessage(eligibility.reason),
    };
  }

  const status = nominationStatusForTarget(true);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("nominations")
    .insert({
      campaign_id: input.campaign.id,
      campaign_category_id: input.campaignCategoryId,
      business_location_id: input.businessLocationId,
      user_id: input.userId,
      verified_email_hash: hashVerifiedEmail(input.email),
      status,
      source: "web",
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        ok: false,
        reason: "duplicate_nomination",
        message: nominationRuleMessage("duplicate_nomination"),
      };
    }
    return { ok: false, reason: "server_error", message: "Unable to save nomination." };
  }

  await recordNominationEvent(data.id, "created", {
    source: "web",
    businessLocationId: input.businessLocationId,
  });

  const categoryName =
    (category as { local_name?: string | null; master_categories?: { name?: string } | null } | null)
      ?.local_name ||
    (category as { master_categories?: { name?: string } | null } | null)?.master_categories?.name ||
    "a category";
  const businessName = business?.public_name || location?.location_name || "a local business";
  const businessEmail =
    input.businessEmail?.trim() || location?.email || business?.primary_email || null;

  await sendNominationReceivedEmail({
    to: input.email,
    userId: input.userId,
    businessName,
    categoryName,
    nominationId: data.id,
    communityName: input.communityName ?? "",
  });

  if (businessEmail) {
    await sendBusinessNominatedEmail({
      to: businessEmail,
      businessName,
      categoryName,
      nominationId: data.id,
      communityName: input.communityName ?? "",
    });
  }

  return { ok: true, nominationId: data.id, status: data.status };
}

export async function createMissingBusinessNomination(input: {
  campaign: Campaign;
  communityId: string;
  communityName?: string;
  userId: string;
  email: string;
  emailConfirmed: boolean;
  campaignCategoryId: string;
  businessName: string;
  address?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  businessEmail: string;
  ipAddress?: string | null;
}): Promise<CreateNominationResult & { locationId?: string }> {
  const campaignState = resolveCampaignState(input.campaign);
  const category = await loadCategoryForCampaign(input.campaign.id, input.campaignCategoryId);

  const eligibility = evaluateNominationEligibility({
    emailConfirmed: input.emailConfirmed,
    campaignState,
    categoryBelongsToCampaign: Boolean(category),
    categoryActive: Boolean(category?.active),
    businessLocationInCommunity: true,
    businessApproved: false,
    businessLocationActive: false,
    hasExistingActiveNomination: false,
    hasBusinessLocation: false,
    hasMissingBusinessSubmission: true,
  });

  if (!eligibility.ok) {
    await recordFraudSignal({
      campaignId: input.campaign.id,
      entityType: "user",
      entityId: input.userId,
      signalType:
        eligibility.reason === "nominations_closed"
          ? "closed_phase_attempt"
          : eligibility.reason === "unverified_user"
            ? "unverified_user"
            : "manual_review",
      riskScore: 35,
      metadata: {
        reason: eligibility.reason,
        ipHash: input.ipAddress ? hashIpFingerprint(input.ipAddress) : null,
      },
    });
    return {
      ok: false,
      reason: eligibility.reason,
      message: nominationRuleMessage(eligibility.reason),
    };
  }

  const listing = await createApprovedBusinessFromNomination({
    communityId: input.communityId,
    campaignCategoryId: input.campaignCategoryId,
    businessName: input.businessName,
    address: input.address ?? null,
    websiteUrl: input.websiteUrl ?? null,
    phone: input.phone ?? null,
    businessEmail: input.businessEmail,
  });

  if (!listing.ok) {
    return { ok: false, reason: "server_error", message: listing.message };
  }

  const submission = await createMissingBusinessSubmission({
    campaignId: input.campaign.id,
    submittedByUserId: input.userId,
    businessName: input.businessName,
    categoryId: input.campaignCategoryId,
    address: input.address ?? null,
    websiteUrl: input.websiteUrl ?? null,
    phone: input.phone ?? null,
    submitterEmail: input.email,
  });

  if (submission.ok && submission.id) {
    const admin = createSupabaseAdminClient();
    await admin
      .from("business_submission_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", submission.id);
  }

  const duplicate = await hasActiveNomination({
    campaignId: input.campaign.id,
    campaignCategoryId: input.campaignCategoryId,
    userId: input.userId,
    businessLocationId: listing.locationId,
  });
  if (duplicate) {
    return {
      ok: false,
      reason: "duplicate_nomination",
      message: nominationRuleMessage("duplicate_nomination"),
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("nominations")
    .insert({
      campaign_id: input.campaign.id,
      campaign_category_id: input.campaignCategoryId,
      business_location_id: listing.locationId,
      business_submission_request_id: submission.id ?? null,
      user_id: input.userId,
      verified_email_hash: hashVerifiedEmail(input.email),
      status: nominationStatusForTarget(true),
      source: "web",
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "server_error", message: "Unable to save nomination." };
  }

  await recordNominationEvent(data.id, "created", {
    source: "web",
    missingBusiness: true,
    submissionId: submission.id ?? null,
    businessLocationId: listing.locationId,
  });

  const categoryName =
    (category as { local_name?: string | null; master_categories?: { name?: string } | null } | null)
      ?.local_name ||
    (category as { master_categories?: { name?: string } | null } | null)?.master_categories?.name ||
    "a category";

  await sendNominationReceivedEmail({
    to: input.email,
    userId: input.userId,
    businessName: input.businessName,
    categoryName,
    nominationId: data.id,
    communityName: input.communityName ?? "",
  });

  await sendBusinessNominatedEmail({
    to: input.businessEmail,
    businessName: input.businessName,
    categoryName,
    nominationId: data.id,
    communityName: input.communityName ?? "",
  });

  return {
    ok: true,
    nominationId: data.id,
    status: data.status,
    locationId: listing.locationId,
  };
}

export async function listUserNominations(input: {
  userId: string;
  campaignId: string;
}): Promise<PublicNominationView[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("nominations")
      .select(
        `
        *,
        campaign_categories (
          local_name,
          local_slug,
          master_categories ( name, slug )
        ),
        business_locations (
          location_name,
          businesses ( public_name )
        ),
        business_submission_requests ( business_name )
      `,
      )
      .eq("user_id", input.userId)
      .eq("campaign_id", input.campaignId)
      .order("created_at", { ascending: false });

    if (!data) {
      return [];
    }

    return data.map((row) => {
      const nomination = mapNomination(row);
      const categoryRaw = row.campaign_categories as unknown as {
        local_name: string | null;
        local_slug: string | null;
        master_categories: { name: string; slug: string } | null;
      } | null;
      const locationRaw = row.business_locations as unknown as {
        location_name: string;
        businesses: { public_name: string } | null;
      } | null;
      const submissionRaw = row.business_submission_requests as unknown as {
        business_name: string;
      } | null;

      const categoryName =
        categoryRaw?.local_name || categoryRaw?.master_categories?.name || "Category";
      const categorySlug =
        categoryRaw?.local_slug || categoryRaw?.master_categories?.slug || "category";

      return toPublicNominationView({
        nomination,
        categoryName,
        categorySlug,
        businessName: locationRaw?.businesses?.public_name ?? locationRaw?.location_name ?? null,
        pendingBusinessName: submissionRaw?.business_name ?? null,
      });
    });
  } catch {
    return [];
  }
}

export async function getBusinessNominationPresence(input: {
  businessId: string;
  campaignId: string;
}): Promise<{ presence: "none" | "nominated"; locationIds: string[] }> {
  const supabase = await createSupabaseServerClient();
  const { data: locations } = await supabase
    .from("business_locations")
    .select("id")
    .eq("business_id", input.businessId)
    .is("deleted_at", null);

  const locationIds = (locations ?? []).map((row) => row.id);
  if (!locationIds.length) {
    return { presence: "none", locationIds: [] };
  }

  const { count } = await supabase
    .from("nominations")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", input.campaignId)
    .eq("status", "valid")
    .in("business_location_id", locationIds);

  return {
    presence: publicNominationPresence(count ?? 0),
    locationIds,
  };
}

export function buildNominationShareUrl(input: {
  communitySubdomain: string;
  categorySlug?: string | null;
}): string {
  const protocol = env.NEXT_PUBLIC_APP_URL.startsWith("https") ? "https" : "http";
  const origin = buildCommunityHostname(
    input.communitySubdomain,
    env.NEXT_PUBLIC_ROOT_DOMAIN,
    protocol,
  );
  if (input.categorySlug) {
    return `${origin}/nominate/${input.categorySlug}`;
  }
  return `${origin}/nominate`;
}

export async function invalidateNomination(input: {
  nominationId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("nominations")
    .update({
      status: "invalidated",
      invalidated_at: new Date().toISOString(),
      invalidated_by: input.actorUserId,
      invalidation_reason: input.reason,
    })
    .eq("id", input.nominationId)
    .neq("status", "invalidated")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "Unable to invalidate nomination." };
  }

  await recordNominationEvent(data.id, "invalidated", {
    reason: input.reason,
    actorUserId: input.actorUserId,
  });

  return { ok: true, message: "Nomination invalidated." };
}

export async function listAdminNominations(campaignId?: string): Promise<Nomination[]> {
  const admin = createSupabaseAdminClient();
  let query = admin.from("nominations").select("*").order("created_at", { ascending: false }).limit(200);
  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }
  const { data } = await query;
  return (data ?? []).map(mapNomination);
}

export async function listPendingMissingBusinessNominations(): Promise<
  Array<Nomination & { businessName: string }>
> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("nominations")
    .select("*, business_submission_requests(business_name, status)")
    .eq("status", "pending_business_moderation")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).flatMap((row) => {
    const submission = row.business_submission_requests as unknown as {
      business_name: string;
      status: string;
    } | null;
    if (!submission) {
      return [];
    }
    return [
      {
        ...mapNomination(row),
        businessName: submission.business_name,
      },
    ];
  });
}

export async function listFraudSignals(campaignId?: string): Promise<FraudSignal[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("fraud_signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(150);
  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }
  const { data } = await query;
  return (data ?? []).map(mapFraudSignal);
}

export async function listInvalidatedNominations(campaignId?: string): Promise<Nomination[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("nominations")
    .select("*")
    .eq("status", "invalidated")
    .order("invalidated_at", { ascending: false })
    .limit(150);
  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }
  const { data } = await query;
  return (data ?? []).map(mapNomination);
}

export async function getCategoryActivity(campaignId: string): Promise<
  Array<{ campaignCategoryId: string; validCount: number; pendingCount: number; invalidatedCount: number }>
> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("nominations")
    .select("campaign_category_id, status")
    .eq("campaign_id", campaignId);

  const map = new Map<
    string,
    { campaignCategoryId: string; validCount: number; pendingCount: number; invalidatedCount: number }
  >();

  for (const row of data ?? []) {
    const current = map.get(row.campaign_category_id) ?? {
      campaignCategoryId: row.campaign_category_id,
      validCount: 0,
      pendingCount: 0,
      invalidatedCount: 0,
    };
    if (row.status === "valid") current.validCount += 1;
    if (row.status === "pending_business_moderation") current.pendingCount += 1;
    if (row.status === "invalidated") current.invalidatedCount += 1;
    map.set(row.campaign_category_id, current);
  }

  return [...map.values()];
}

export async function exportNominationsCsv(campaignId: string): Promise<string> {
  const nominations = await listAdminNominations(campaignId);
  const header = [
    "id",
    "campaign_id",
    "campaign_category_id",
    "business_location_id",
    "business_submission_request_id",
    "user_id",
    "status",
    "source",
    "created_at",
    "invalidated_at",
    "invalidation_reason",
  ];
  const lines = [header.join(",")];
  for (const row of nominations) {
    lines.push(
      [
        row.id,
        row.campaignId,
        row.campaignCategoryId,
        row.businessLocationId ?? "",
        row.businessSubmissionRequestId ?? "",
        row.userId,
        row.status,
        row.source,
        row.createdAt,
        row.invalidatedAt ?? "",
        JSON.stringify(row.invalidationReason ?? ""),
      ].join(","),
    );
  }

  for (const row of nominations.slice(0, 50)) {
    await recordNominationEvent(row.id, "exported", { campaignId });
  }

  return lines.join("\n");
}

export async function reviewFraudSignal(input: {
  signalId: string;
  status: "reviewed" | "dismissed" | "confirmed";
  reviewerUserId: string;
}): Promise<{ ok: boolean }> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("fraud_signals")
    .update({
      status: input.status,
      reviewed_by: input.reviewerUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.signalId);

  return { ok: !error };
}

/** Promote pending nominations when a missing-business request is approved and linked to a location. */
export async function promotePendingNominationsForSubmission(input: {
  submissionId: string;
  businessLocationId: string;
  actorUserId: string;
}): Promise<number> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("nominations")
    .update({
      status: "valid",
      business_location_id: input.businessLocationId,
    })
    .eq("business_submission_request_id", input.submissionId)
    .eq("status", "pending_business_moderation")
    .select("id");

  for (const row of data ?? []) {
    await recordNominationEvent(row.id, "business_moderated", {
      businessLocationId: input.businessLocationId,
      actorUserId: input.actorUserId,
    });
  }

  return data?.length ?? 0;
}
