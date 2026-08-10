import type {
  Campaign,
  CampaignCategory,
  CampaignPhase,
  CampaignTemplate,
  CategoryGroup,
  MasterCategory,
  PublicCampaignCategory,
} from "@/types/campaign";
import type { Database } from "@/types/database";

type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type TemplateRow = Database["public"]["Tables"]["campaign_templates"]["Row"];
type PhaseRow = Database["public"]["Tables"]["campaign_phases"]["Row"];
type GroupRow = Database["public"]["Tables"]["category_groups"]["Row"];
type MasterRow = Database["public"]["Tables"]["master_categories"]["Row"];
type CampaignCategoryRow = Database["public"]["Tables"]["campaign_categories"]["Row"];

export function mapCampaignTemplate(row: TemplateRow): CampaignTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultNominationDays: row.default_nomination_days,
    defaultReviewDays: row.default_review_days,
    defaultVotingDays: row.default_voting_days,
    defaultAuditDays: row.default_audit_days,
    active: row.active,
  };
}

export function mapCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    communityId: row.community_id,
    campaignTemplateId: row.campaign_template_id,
    year: row.year,
    name: row.name,
    status: row.status,
    nominationOpensAt: row.nomination_opens_at,
    nominationClosesAt: row.nomination_closes_at,
    finalistReviewClosesAt: row.finalist_review_closes_at,
    votingOpensAt: row.voting_opens_at,
    votingClosesAt: row.voting_closes_at,
    resultsPublishAt: row.results_publish_at,
    timezone: row.timezone,
    exactVoteTotalsPublic: row.exact_vote_totals_public,
    votingLockedAt: row.voting_locked_at,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCampaignPhase(row: PhaseRow): CampaignPhase {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    phase: row.phase,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
  };
}

export function mapCategoryGroup(row: GroupRow): CategoryGroup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    displayOrder: row.display_order,
    active: row.active,
  };
}

export function mapMasterCategory(row: MasterRow): MasterCategory {
  return {
    id: row.id,
    categoryGroupId: row.category_group_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    active: row.active,
    displayOrder: row.display_order,
  };
}

export function mapCampaignCategory(row: CampaignCategoryRow): CampaignCategory {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    masterCategoryId: row.master_category_id,
    localName: row.local_name,
    localSlug: row.local_slug,
    localDescription: row.local_description,
    finalistLimit: row.finalist_limit,
    minimumNominationCount: row.minimum_nomination_count,
    active: row.active,
    displayOrder: row.display_order,
  };
}

export function toPublicCampaignCategory(
  category: CampaignCategory,
  master: MasterCategory,
  group: CategoryGroup,
): PublicCampaignCategory {
  return {
    ...category,
    displayName: category.localName?.trim() || master.name,
    displaySlug: category.localSlug?.trim() || master.slug,
    displayDescription: category.localDescription?.trim() || master.description,
    masterName: master.name,
    masterSlug: master.slug,
    groupName: group.name,
    groupSlug: group.slug,
  };
}
