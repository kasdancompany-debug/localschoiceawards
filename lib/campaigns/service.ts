import "server-only";

import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { withSoftTimeout } from "@/lib/async/soft-timeout";
import { buildScheduleFromTemplate, toIsoSchedule } from "@/lib/campaigns/schedule";
import { mapCampaign, mapCampaignTemplate } from "@/lib/campaigns/mappers";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { validateCampaignDates } from "@/lib/validation/campaigns";
import type { Campaign, CampaignTemplate } from "@/types/campaign";

export async function listActiveCampaignTemplates(): Promise<CampaignTemplate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_templates")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error || !data) {
    return [];
  }

  return data.map(mapCampaignTemplate);
}

export async function getCampaignTemplateById(id: string): Promise<CampaignTemplate | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCampaignTemplate(data);
}

export async function getCampaignByCommunityYear(
  communityId: string,
  year: number,
): Promise<Campaign | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("community_id", communityId)
    .eq("year", year)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCampaign(data);
}

export async function listCampaignsForCommunity(communityId: string): Promise<Campaign[]> {
  if (communityId.startsWith("pilot-")) {
    const { getPilotCampaignForCommunity } = await import("@/lib/pilot/directory-catalog");
    const pilot = getPilotCampaignForCommunity(communityId);
    return pilot ? [pilot] : [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const query = supabase
      .from("campaigns")
      .select("*")
      .eq("community_id", communityId)
      .order("year", { ascending: false });

    const { data, error } = await withSoftTimeout(
      query,
      { data: null, error: null } as unknown as Awaited<typeof query>,
    );

    if (error || !data) {
      return [];
    }

    return data.map(mapCampaign);
  } catch {
    return [];
  }
}

export async function getPublicCampaignForCommunity(
  communityId: string,
  year?: number,
): Promise<Campaign | null> {
  const campaigns = await listCampaignsForCommunity(communityId);
  const filtered = year ? campaigns.filter((campaign) => campaign.year === year) : campaigns;

  for (const campaign of filtered) {
    const state = resolveCampaignState(campaign);
    if (state.canPublicReadCampaign) {
      return campaign;
    }
  }

  return null;
}

export async function listPublicCampaignsForCommunity(
  communityId: string,
): Promise<Campaign[]> {
  const campaigns = await listCampaignsForCommunity(communityId);
  return campaigns.filter((campaign) => resolveCampaignState(campaign).canPublicReadCampaign);
}

export async function listPublishedResultCampaignsForCommunity(
  communityId: string,
): Promise<Campaign[]> {
  const campaigns = await listPublicCampaignsForCommunity(communityId);
  return campaigns.filter((campaign) => resolveCampaignState(campaign).canPublicReadResults);
}

export type CreateCampaignFromTemplateInput = {
  communityId: string;
  templateId: string;
  year: number;
  name: string;
  timezone: string;
  nominationOpensAtLocal: string;
  publishImmediately?: boolean;
  includeInactiveMasterCategories?: boolean;
  actorUserId?: string;
};

export async function createCampaignFromTemplate(
  input: CreateCampaignFromTemplateInput,
): Promise<Campaign> {
  const template = await getCampaignTemplateById(input.templateId);
  if (!template || !template.active) {
    throw new Error("Campaign template not found or inactive.");
  }

  const existing = await getCampaignByCommunityYear(input.communityId, input.year);
  if (existing) {
    throw new Error(`A campaign already exists for this community in ${input.year}.`);
  }

  const schedule = buildScheduleFromTemplate({
    template,
    nominationOpensAtLocal: input.nominationOpensAtLocal,
    timezone: input.timezone,
  });
  const iso = toIsoSchedule(schedule);
  const validation = validateCampaignDates(iso);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  const supabase = await createSupabaseServerClient();
  const status = input.publishImmediately ? "scheduled" : "draft";
  const publishedAt = input.publishImmediately ? new Date().toISOString() : null;

  const { data: campaignRow, error } = await supabase
    .from("campaigns")
    .insert({
      community_id: input.communityId,
      campaign_template_id: template.id,
      year: input.year,
      name: input.name,
      status,
      nomination_opens_at: iso.nominationOpensAt,
      nomination_closes_at: iso.nominationClosesAt,
      finalist_review_closes_at: iso.finalistReviewClosesAt,
      voting_opens_at: iso.votingOpensAt,
      voting_closes_at: iso.votingClosesAt,
      results_publish_at: iso.resultsPublishAt,
      timezone: input.timezone,
      exact_vote_totals_public: false,
      published_at: publishedAt,
    })
    .select("*")
    .single();

  if (error || !campaignRow) {
    throw new Error(error?.message ?? "Unable to create campaign.");
  }

  const campaign = mapCampaign(campaignRow);

  const phaseRows = [
    {
      campaign_id: campaign.id,
      phase: "nomination" as const,
      starts_at: iso.nominationOpensAt,
      ends_at: iso.nominationClosesAt,
      status: "scheduled" as const,
    },
    {
      campaign_id: campaign.id,
      phase: "finalist_review" as const,
      starts_at: iso.nominationClosesAt,
      ends_at: iso.finalistReviewClosesAt,
      status: "scheduled" as const,
    },
    {
      campaign_id: campaign.id,
      phase: "voting" as const,
      starts_at: iso.votingOpensAt,
      ends_at: iso.votingClosesAt,
      status: "scheduled" as const,
    },
    {
      campaign_id: campaign.id,
      phase: "audit" as const,
      starts_at: iso.votingClosesAt,
      ends_at: iso.resultsPublishAt,
      status: "scheduled" as const,
    },
    {
      campaign_id: campaign.id,
      phase: "results" as const,
      starts_at: iso.resultsPublishAt,
      ends_at: new Date(
        new Date(iso.resultsPublishAt).getTime() + 1000 * 60 * 60 * 24 * 280,
      ).toISOString(),
      status: "scheduled" as const,
    },
  ];

  const { error: phaseError } = await supabase.from("campaign_phases").insert(phaseRows);
  if (phaseError) {
    throw new Error(phaseError.message);
  }

  let masterQuery = supabase.from("master_categories").select("id, display_order, active");

  if (!input.includeInactiveMasterCategories) {
    masterQuery = masterQuery.eq("active", true);
  }

  const { data: masters, error: masterError } = await masterQuery;
  if (masterError) {
    throw new Error(masterError.message);
  }

  if (masters?.length) {
    const categoryRows = masters.map((master) => ({
      campaign_id: campaign.id,
      master_category_id: master.id,
      finalist_limit: 5,
      minimum_nomination_count: 3,
      active: true,
      display_order: master.display_order,
    }));

    const { error: categoryError } = await supabase
      .from("campaign_categories")
      .insert(categoryRows);
    if (categoryError) {
      throw new Error(categoryError.message);
    }
  }

  await supabase.rpc("record_campaign_audit", {
    p_community_id: input.communityId,
    p_campaign_id: campaign.id,
    p_entity_type: "campaign",
    p_entity_id: campaign.id,
    p_action: "created",
    p_summary: `Created campaign ${campaign.name} from template ${template.name}`,
    p_before: {},
    p_after: campaignRow,
  });

  return campaign;
}
