import type {
  FraudSignal,
  Nomination,
  NominationEvent,
  PublicNominationView,
} from "@/types/nomination";
import type { Database } from "@/types/database";

type NominationRow = Database["public"]["Tables"]["nominations"]["Row"];
type NominationEventRow = Database["public"]["Tables"]["nomination_events"]["Row"];
type FraudSignalRow = Database["public"]["Tables"]["fraud_signals"]["Row"];

export function mapNomination(row: NominationRow): Nomination {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignCategoryId: row.campaign_category_id,
    businessLocationId: row.business_location_id,
    businessSubmissionRequestId: row.business_submission_request_id,
    userId: row.user_id,
    verifiedEmailHash: row.verified_email_hash,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
    invalidatedAt: row.invalidated_at,
    invalidatedBy: row.invalidated_by,
    invalidationReason: row.invalidation_reason,
  };
}

export function mapNominationEvent(row: NominationEventRow): NominationEvent {
  return {
    id: row.id,
    nominationId: row.nomination_id,
    eventType: row.event_type,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export function mapFraudSignal(row: FraudSignalRow): FraudSignal {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    signalType: row.signal_type,
    riskScore: row.risk_score,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export function toPublicNominationView(input: {
  nomination: Nomination;
  categoryName: string;
  categorySlug: string;
  businessName: string | null;
  pendingBusinessName: string | null;
}): PublicNominationView {
  return {
    id: input.nomination.id,
    status: input.nomination.status,
    createdAt: input.nomination.createdAt,
    categoryName: input.categoryName,
    categorySlug: input.categorySlug,
    businessName: input.businessName,
    pendingBusinessName: input.pendingBusinessName,
  };
}
