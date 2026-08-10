import type {
  AwardAsset,
  AwardEligibility,
  ResultRow,
  ResultRun,
  ResultRulesSnapshot,
} from "@/types/results";
import type { Database } from "@/types/database";

type ResultRunDb = Database["public"]["Tables"]["result_runs"]["Row"];
type ResultDb = Database["public"]["Tables"]["results"]["Row"];
type EligibilityDb = Database["public"]["Tables"]["award_eligibilities"]["Row"];
type AssetDb = Database["public"]["Tables"]["award_assets"]["Row"];

export function mapResultRun(row: ResultRunDb): ResultRun {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    status: row.status,
    rulesSnapshot: (row.rules_snapshot ?? {}) as ResultRulesSnapshot | Record<string, unknown>,
    startedBy: row.started_by,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapResult(row: ResultDb): ResultRow {
  return {
    id: row.id,
    resultRunId: row.result_run_id,
    campaignId: row.campaign_id,
    campaignCategoryId: row.campaign_category_id,
    finalistId: row.finalist_id,
    businessLocationId: row.business_location_id,
    validVoteCount: row.valid_vote_count,
    placement: row.placement,
    tied: row.tied,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAwardEligibility(row: EligibilityDb): AwardEligibility {
  return {
    id: row.id,
    resultId: row.result_id,
    businessId: row.business_id,
    businessLocationId: row.business_location_id,
    campaignId: row.campaign_id,
    campaignCategoryId: row.campaign_category_id,
    placement: row.placement,
    eligibilityStatus: row.eligibility_status,
    personalizedBusinessName: row.personalized_business_name,
    personalizedCommunityName: row.personalized_community_name,
    personalizedCategoryName: row.personalized_category_name,
    personalizedCampaignYear: row.personalized_campaign_year,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    revocationReason: row.revocation_reason,
  };
}

export function mapAwardAsset(row: AssetDb): AwardAsset {
  return {
    id: row.id,
    awardEligibilityId: row.award_eligibility_id,
    assetType: row.asset_type,
    storagePath: row.storage_path,
    contentType: row.content_type,
    createdAt: row.created_at,
  };
}
