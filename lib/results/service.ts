import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { env } from "@/lib/env/server";
import { buildCommunityHostname } from "@/lib/communities/hostname";
import { resolveCampaignState } from "@/lib/campaigns/state";
import {
  buildWinnerBadgeSvg,
  buildWinnerCertificatePdf,
  buildWinnerQrPng,
  buildWinnerSquareSvg,
  buildWinnerStorySvg,
  svgToPngBuffer,
} from "@/lib/results/assets";
import {
  mapAwardAsset,
  mapAwardEligibility,
  mapResult,
  mapResultRun,
} from "@/lib/results/mappers";
import {
  assignPlacementsCompetitionRanking,
  buildResultRulesSnapshot,
  canApproveResultRun,
  canPublishResultRun,
  publicVoteCount,
} from "@/lib/results/rules";
import type { Campaign } from "@/types/campaign";
import type {
  AwardAsset,
  AwardEligibility,
  PublicWinnerView,
  ResultRow,
  ResultRun,
  ResultRulesSnapshot,
} from "@/types/results";

const AWARD_BUCKET = "award-assets";

async function recordResultEvent(
  resultRunId: string,
  eventType:
    | "started"
    | "computed"
    | "approved"
    | "published"
    | "superseded"
    | "cancelled"
    | "eligibility_created"
    | "eligibility_revoked"
    | "assets_generated",
  actorUserId: string | null,
  metadata: Record<string, string | number | boolean | null> = {},
) {
  const admin = createSupabaseAdminClient();
  await admin.from("result_run_events").insert({
    result_run_id: resultRunId,
    event_type: eventType,
    actor_user_id: actorUserId,
    metadata,
  });
}

export async function startAndComputeResultRun(input: {
  campaign: Campaign;
  actorUserId: string;
}): Promise<{ ok: boolean; message: string; resultRunId?: string }> {
  const admin = createSupabaseAdminClient();
  const state = resolveCampaignState(input.campaign);

  // Prefer after voting; still allow admin compute during audit/results prep.
  if (state.activePhase === "nomination" || state.activePhase === "finalist_review") {
    return {
      ok: false,
      message: "Results can be computed after nominations and finalist review complete.",
    };
  }

  const { data: publishedExisting } = await admin
    .from("result_runs")
    .select("id")
    .eq("campaign_id", input.campaign.id)
    .eq("status", "published")
    .maybeSingle();

  if (publishedExisting) {
    return {
      ok: false,
      message: "A published result run already exists. Publication is locked for this campaign.",
    };
  }

  // Supersede any in-flight runs.
  await admin
    .from("result_runs")
    .update({ status: "superseded" })
    .eq("campaign_id", input.campaign.id)
    .in("status", ["draft", "computing", "pending_approval", "approved"]);

  const rules = buildResultRulesSnapshot({
    publishExactVoteCounts: input.campaign.exactVoteTotalsPublic,
  });

  const { data: run, error: runError } = await admin
    .from("result_runs")
    .insert({
      campaign_id: input.campaign.id,
      status: "computing",
      rules_snapshot: rules,
      started_by: input.actorUserId,
      started_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (runError || !run) {
    return { ok: false, message: "Unable to start result run." };
  }

  await recordResultEvent(run.id, "started", input.actorUserId, {
    campaignId: input.campaign.id,
  });

  const { data: categories } = await admin
    .from("campaign_categories")
    .select("id")
    .eq("campaign_id", input.campaign.id)
    .eq("active", true);

  let resultCount = 0;

  for (const category of categories ?? []) {
    const { data: finalists } = await admin
      .from("finalists")
      .select("id, business_location_id")
      .eq("campaign_id", input.campaign.id)
      .eq("campaign_category_id", category.id)
      .eq("status", "published");

    if (!finalists?.length) {
      continue;
    }

    const candidates = [];
    for (const finalist of finalists) {
      const { count } = await admin
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", input.campaign.id)
        .eq("campaign_category_id", category.id)
        .eq("finalist_id", finalist.id)
        .eq("status", "active");

      candidates.push({
        finalistId: finalist.id,
        businessLocationId: finalist.business_location_id,
        validVoteCount: count ?? 0,
      });
    }

    const withVotes = candidates.filter((candidate) => candidate.validVoteCount > 0);
    const placements = assignPlacementsCompetitionRanking(withVotes);

    if (placements.length) {
      const { error } = await admin.from("results").insert(
        placements.map((item) => ({
          result_run_id: run.id,
          campaign_id: input.campaign.id,
          campaign_category_id: category.id,
          finalist_id: item.finalistId,
          business_location_id: item.businessLocationId,
          valid_vote_count: item.validVoteCount,
          placement: item.placement,
          tied: item.tied,
          published: false,
        })),
      );
      if (!error) {
        resultCount += placements.length;
      }
    }
  }

  await admin
    .from("result_runs")
    .update({
      status: "pending_approval",
      completed_at: new Date().toISOString(),
    })
    .eq("id", run.id);

  await recordResultEvent(run.id, "computed", input.actorUserId, {
    resultCount,
  });

  return {
    ok: true,
    message: `Computed ${resultCount} result row(s). Awaiting administrator approval.`,
    resultRunId: run.id,
  };
}

export async function approveResultRun(input: {
  resultRunId: string;
  actorUserId: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data: run } = await admin
    .from("result_runs")
    .select("*")
    .eq("id", input.resultRunId)
    .maybeSingle();

  if (!run || !canApproveResultRun(run.status)) {
    return { ok: false, message: "Result run is not awaiting approval." };
  }

  const { error } = await admin
    .from("result_runs")
    .update({
      status: "approved",
      approved_by: input.actorUserId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", input.resultRunId);

  if (error) {
    return { ok: false, message: "Unable to approve result run." };
  }

  await recordResultEvent(run.id, "approved", input.actorUserId);
  return { ok: true, message: "Result run approved. Ready to publish." };
}

export async function publishResultRun(input: {
  resultRunId: string;
  actorUserId: string;
  campaign: Campaign;
  communityName: string;
  communitySubdomain: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data: run } = await admin
    .from("result_runs")
    .select("*")
    .eq("id", input.resultRunId)
    .maybeSingle();

  if (!run) {
    return { ok: false, message: "Result run not found." };
  }

  const { data: publishedExisting } = await admin
    .from("result_runs")
    .select("id")
    .eq("campaign_id", run.campaign_id)
    .eq("status", "published")
    .maybeSingle();

  const { count } = await admin
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("result_run_id", run.id);

  const gate = canPublishResultRun({
    status: run.status,
    hasResults: (count ?? 0) > 0,
    alreadyHasPublishedRun: Boolean(publishedExisting),
  });

  if (!gate.ok) {
    const messages = {
      publication_locked: "Publication is locked: a published run already exists.",
      not_approved: "Approve the result run before publishing.",
      empty: "Cannot publish an empty result run.",
    };
    return { ok: false, message: messages[gate.reason] };
  }

  const { data: rows } = await admin
    .from("results")
    .select("*")
    .eq("result_run_id", run.id);

  await admin.from("results").update({ published: true }).eq("result_run_id", run.id);

  const { data: categories } = await admin
    .from("campaign_categories")
    .select("id, local_name, local_slug, master_categories(name, slug)")
    .eq("campaign_id", run.campaign_id);

  const categoryNameById = new Map<string, string>();
  const categorySlugById = new Map<string, string>();
  for (const category of categories ?? []) {
    const master = category.master_categories as unknown as { name: string; slug: string } | null;
    categoryNameById.set(category.id, category.local_name || master?.name || "Category");
    categorySlugById.set(category.id, category.local_slug || master?.slug || "category");
  }

  let eligibilityCount = 0;
  for (const row of rows ?? []) {
    const { data: location } = await admin
      .from("business_locations")
      .select("id, business_id, location_name, businesses(id, public_name, slug)")
      .eq("id", row.business_location_id)
      .maybeSingle();

    const business = location?.businesses as unknown as {
      id: string;
      public_name: string;
      slug: string;
    } | null;

    if (!location || !business) {
      continue;
    }

    const { data: eligibility, error } = await admin
      .from("award_eligibilities")
      .insert({
        result_id: row.id,
        business_id: business.id,
        business_location_id: location.id,
        campaign_id: run.campaign_id,
        campaign_category_id: row.campaign_category_id,
        placement: row.placement,
        eligibility_status: "active",
        personalized_business_name: business.public_name,
        personalized_community_name: input.communityName,
        personalized_category_name:
          categoryNameById.get(row.campaign_category_id) ?? "Category",
        personalized_campaign_year: input.campaign.year,
      })
      .select("*")
      .maybeSingle();

    if (error || !eligibility) {
      continue;
    }

    eligibilityCount += 1;
    await recordResultEvent(run.id, "eligibility_created", input.actorUserId, {
      eligibilityId: eligibility.id,
      resultId: row.id,
    });

    const winnerUrl = buildWinnerPublicUrl({
      communitySubdomain: input.communitySubdomain,
      year: input.campaign.year,
      categorySlug: categorySlugById.get(row.campaign_category_id) ?? "category",
    });

    await generateAndStoreAwardAssets({
      eligibilityId: eligibility.id,
      businessId: business.id,
      businessName: business.public_name,
      communityName: input.communityName,
      categoryName: categoryNameById.get(row.campaign_category_id) ?? "Category",
      year: input.campaign.year,
      placement: row.placement,
      winnerUrl,
      actorUserId: input.actorUserId,
      resultRunId: run.id,
    });

    // Notify active business owners/admins; sales sequence requires marketing + winner consent.
    const { data: members } = await admin
      .from("business_memberships")
      .select("user_id, role")
      .eq("business_id", business.id)
      .eq("status", "active")
      .in("role", ["owner", "administrator", "manager", "marketing"]);

    for (const member of members ?? []) {
      const { data: authUser } = await admin.auth.admin.getUserById(member.user_id);
      const email = authUser.user?.email;
      if (!email) continue;

      const { softEmitNotificationEvent } = await import("@/lib/notifications/emit");
      const { getNotificationPreferences } = await import("@/lib/notifications/preferences");
      const { enqueueWinnerSalesSequence } = await import("@/lib/notifications/winner-sales");

      await softEmitNotificationEvent({
        eventType: "campaign.winner_announced",
        aggregateType: "award_eligibility",
        aggregateId: eligibility.id,
        templateKey: "campaign.winner_announced",
        recipientEmail: email,
        userId: member.user_id,
        recipientSource: "business_member",
        sequenceKey: member.user_id,
        subjectVars: { communityName: input.communityName, businessName: business.public_name },
        templateVars: {
          communityName: input.communityName,
          businessName: business.public_name,
          actionUrl: winnerUrl,
        },
      });

      const prefs = await getNotificationPreferences(member.user_id);
      await enqueueWinnerSalesSequence({
        businessId: business.id,
        businessName: business.public_name,
        recipientEmail: email,
        userId: member.user_id,
        communityName: input.communityName,
        hasMarketingConsent: prefs?.marketingEmails ?? false,
        hasWinnerSalesConsent: prefs?.winnerSalesEmails ?? false,
      });
    }
  }

  const now = new Date().toISOString();
  await admin
    .from("result_runs")
    .update({
      status: "published",
      published_at: now,
    })
    .eq("id", run.id);

  await admin
    .from("campaigns")
    .update({
      status: "results_published",
    })
    .eq("id", run.campaign_id);

  await recordResultEvent(run.id, "published", input.actorUserId, {
    eligibilityCount,
  });

  return {
    ok: true,
    message: `Published results and created ${eligibilityCount} award eligibility record(s).`,
  };
}

async function generateAndStoreAwardAssets(input: {
  eligibilityId: string;
  businessId: string;
  businessName: string;
  communityName: string;
  categoryName: string;
  year: number;
  placement: ResultRow["placement"];
  winnerUrl: string;
  actorUserId: string;
  resultRunId: string;
}) {
  const admin = createSupabaseAdminClient();
  const templateInput = {
    businessName: input.businessName,
    communityName: input.communityName,
    categoryName: input.categoryName,
    year: input.year,
    placement: input.placement,
  };

  const badgeSvg = buildWinnerBadgeSvg(templateInput);
  const squareSvg = buildWinnerSquareSvg(templateInput);
  const storySvg = buildWinnerStorySvg(templateInput);
  const [badgePng, qrPng, certificatePdf] = await Promise.all([
    svgToPngBuffer(badgeSvg),
    buildWinnerQrPng(input.winnerUrl),
    buildWinnerCertificatePdf(templateInput),
  ]);

  const assets: Array<{
    type: AwardAsset["assetType"];
    contentType: string;
    body: Buffer | Uint8Array;
    ext: string;
  }> = [
    { type: "badge_png", contentType: "image/png", body: badgePng, ext: "png" },
    {
      type: "square_svg",
      contentType: "image/svg+xml",
      body: Buffer.from(squareSvg, "utf8"),
      ext: "svg",
    },
    {
      type: "story_svg",
      contentType: "image/svg+xml",
      body: Buffer.from(storySvg, "utf8"),
      ext: "svg",
    },
    {
      type: "certificate_pdf",
      contentType: "application/pdf",
      body: certificatePdf,
      ext: "pdf",
    },
    { type: "qr_png", contentType: "image/png", body: qrPng, ext: "png" },
  ];

  for (const asset of assets) {
    const path = `${input.businessId}/${input.eligibilityId}/${asset.type}.${asset.ext}`;
    const { error: uploadError } = await admin.storage.from(AWARD_BUCKET).upload(path, asset.body, {
      contentType: asset.contentType,
      upsert: true,
    });
    if (uploadError) {
      continue;
    }
    await admin.from("award_assets").upsert(
      {
        award_eligibility_id: input.eligibilityId,
        asset_type: asset.type,
        storage_path: path,
        content_type: asset.contentType,
      },
      { onConflict: "award_eligibility_id,asset_type" },
    );
  }

  await recordResultEvent(input.resultRunId, "assets_generated", input.actorUserId, {
    eligibilityId: input.eligibilityId,
  });
}

export function buildWinnerPublicUrl(input: {
  communitySubdomain: string;
  year: number;
  categorySlug: string;
}): string {
  const protocol = env.NEXT_PUBLIC_APP_URL.startsWith("https") ? "https" : "http";
  const origin = buildCommunityHostname(
    input.communitySubdomain,
    env.NEXT_PUBLIC_ROOT_DOMAIN,
    protocol,
  );
  return `${origin}/winners/${input.year}/${input.categorySlug}`;
}

export async function revokeAwardEligibility(input: {
  eligibilityId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("award_eligibilities")
    .update({
      eligibility_status: "revoked",
      revoked_at: new Date().toISOString(),
      revocation_reason: input.reason,
    })
    .eq("id", input.eligibilityId)
    .eq("eligibility_status", "active")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "Unable to revoke eligibility." };
  }

  const { data: result } = await admin
    .from("results")
    .select("result_run_id")
    .eq("id", data.result_id)
    .maybeSingle();

  if (result?.result_run_id) {
    await recordResultEvent(result.result_run_id, "eligibility_revoked", input.actorUserId, {
      eligibilityId: data.id,
      reason: input.reason,
    });
  }

  return {
    ok: true,
    message: "Eligibility revoked. Historical result rows were preserved.",
  };
}

export async function listResultRuns(campaignId: string): Promise<ResultRun[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("result_runs")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("started_at", { ascending: false });
  return (data ?? []).map(mapResultRun);
}

export async function listResultsForRun(resultRunId: string): Promise<ResultRow[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("results")
    .select("*")
    .eq("result_run_id", resultRunId)
    .order("placement");
  return (data ?? []).map(mapResult);
}

export async function listPublishedWinners(input: {
  campaign: Campaign;
  communityId: string;
  categorySlug?: string;
}): Promise<PublicWinnerView[]> {
  const state = resolveCampaignState(input.campaign);
  if (!state.canPublicReadResults) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: publishedRun } = await supabase
      .from("result_runs")
      .select("id, rules_snapshot")
      .eq("campaign_id", input.campaign.id)
      .eq("status", "published")
      .maybeSingle();

    if (!publishedRun) {
      return [];
    }

    const rules = publishedRun.rules_snapshot as unknown as ResultRulesSnapshot;
    const showCounts = Boolean(rules?.publishExactVoteCounts);

    const { data } = await supabase
      .from("results")
      .select(
        `
        id,
        placement,
        tied,
        valid_vote_count,
        campaign_category_id,
        business_location_id,
        campaign_categories (
          local_name,
          local_slug,
          master_categories ( name, slug, category_groups ( name ) )
        ),
        business_locations!inner (
          location_name,
          community_id,
          businesses!inner (
            id,
            public_name,
            slug,
            logo_url
          )
        )
      `,
      )
      .eq("result_run_id", publishedRun.id)
      .eq("published", true)
      .eq("business_locations.community_id", input.communityId);

    return (data ?? []).flatMap((row) => {
      const category = row.campaign_categories as unknown as {
        local_name: string | null;
        local_slug: string | null;
        master_categories: {
          name: string;
          slug: string;
          category_groups: { name: string } | null;
        } | null;
      } | null;
      const location = row.business_locations as unknown as {
        location_name: string;
        community_id: string;
        businesses: {
          id: string;
          public_name: string;
          slug: string;
          logo_url: string | null;
        };
      };

      const categorySlug =
        category?.local_slug || category?.master_categories?.slug || "category";
      if (input.categorySlug && categorySlug !== input.categorySlug) {
        return [];
      }

      return [
        {
          resultId: row.id,
          placement: row.placement,
          tied: row.tied,
          validVoteCount: publicVoteCount(row.valid_vote_count, showCounts),
          categoryId: row.campaign_category_id,
          categoryName:
            category?.local_name || category?.master_categories?.name || "Category",
          categorySlug,
          groupName: category?.master_categories?.category_groups?.name || "Categories",
          businessId: location.businesses.id,
          businessName: location.businesses.public_name,
          businessSlug: location.businesses.slug,
          locationName: location.location_name,
          logoUrl: location.businesses.logo_url,
          campaignYear: input.campaign.year,
        } satisfies PublicWinnerView,
      ];
    });
  } catch {
    return [];
  }
}

export async function campaignHasPublishedResults(campaignId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from("result_runs")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "published");
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function listBusinessAwardEligibilities(businessId: string): Promise<
  AwardEligibility[]
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("award_eligibilities")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapAwardEligibility);
}

export async function listAwardAssets(eligibilityId: string): Promise<AwardAsset[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("award_assets")
    .select("*")
    .eq("award_eligibility_id", eligibilityId);
  return (data ?? []).map(mapAwardAsset);
}

export async function getSignedAwardAssetUrl(storagePath: string): Promise<string | null> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage
      .from(AWARD_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    if (error || !data) {
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function listAdminEligibilities(campaignId: string): Promise<AwardEligibility[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("award_eligibilities")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(mapAwardEligibility);
}

export async function listPublicBusinessWins(input: {
  businessId: string;
  communityId: string;
}): Promise<PublicWinnerView[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("award_eligibilities")
      .select(
        `
        id,
        placement,
        personalized_business_name,
        personalized_category_name,
        personalized_campaign_year,
        personalized_community_name,
        campaign_category_id,
        result_id,
        campaign_id,
        results!inner (
          tied,
          valid_vote_count,
          published,
          campaigns!inner (
            year,
            exact_vote_totals_public,
            community_id
          )
        )
      `,
      )
      .eq("business_id", input.businessId)
      .eq("eligibility_status", "active")
      .eq("results.published", true);

    return (data ?? []).flatMap((row) => {
      const result = row.results as unknown as {
        tied: boolean;
        valid_vote_count: number;
        published: boolean;
        campaigns: {
          year: number;
          exact_vote_totals_public: boolean;
          community_id: string;
        };
      } | null;
      if (!result || result.campaigns.community_id !== input.communityId) {
        return [];
      }
      return [
        {
          resultId: row.result_id,
          eligibilityId: row.id,
          placement: row.placement,
          tied: result.tied,
          validVoteCount: publicVoteCount(
            result.valid_vote_count,
            result.campaigns.exact_vote_totals_public,
          ),
          categoryId: row.campaign_category_id,
          categoryName: row.personalized_category_name,
          categorySlug: "category",
          groupName: "Awards",
          businessId: input.businessId,
          businessName: row.personalized_business_name,
          businessSlug: "",
          locationName: row.personalized_community_name,
          logoUrl: null,
          campaignYear: row.personalized_campaign_year,
        } satisfies PublicWinnerView,
      ];
    });
  } catch {
    return [];
  }
}
