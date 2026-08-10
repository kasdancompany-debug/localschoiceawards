import type { Finalist, Vote, VoteEvent, PublicFinalistView } from "@/types/voting";
import type { Database } from "@/types/database";

type FinalistRow = Database["public"]["Tables"]["finalists"]["Row"];
type VoteRow = Database["public"]["Tables"]["votes"]["Row"];
type VoteEventRow = Database["public"]["Tables"]["vote_events"]["Row"];

export function mapFinalist(row: FinalistRow): Finalist {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignCategoryId: row.campaign_category_id,
    businessLocationId: row.business_location_id,
    nominationCountSnapshot: row.nomination_count_snapshot,
    selectionMethod: row.selection_method,
    status: row.status,
    selectedAt: row.selected_at,
    selectedBy: row.selected_by,
    adminNotes: row.admin_notes,
    removalReason: row.removal_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVote(row: VoteRow): Vote {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignCategoryId: row.campaign_category_id,
    finalistId: row.finalist_id,
    userId: row.user_id,
    verifiedEmailHash: row.verified_email_hash,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    invalidatedAt: row.invalidated_at,
    invalidatedBy: row.invalidated_by,
    invalidationReason: row.invalidation_reason,
  };
}

export function mapVoteEvent(row: VoteEventRow): VoteEvent {
  return {
    id: row.id,
    voteId: row.vote_id,
    eventType: row.event_type,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export function toPublicFinalistView(input: {
  finalistId: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  groupName: string;
  businessName: string;
  businessSlug: string;
  locationName: string;
  logoUrl: string | null;
}): PublicFinalistView {
  return {
    id: input.finalistId,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    categorySlug: input.categorySlug,
    groupName: input.groupName,
    businessName: input.businessName,
    businessSlug: input.businessSlug,
    locationName: input.locationName,
    logoUrl: input.logoUrl,
  };
}
