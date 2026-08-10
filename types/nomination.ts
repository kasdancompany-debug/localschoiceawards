export const NOMINATION_STATUSES = [
  "valid",
  "pending_business_moderation",
  "invalidated",
] as const;

export type NominationStatus = (typeof NOMINATION_STATUSES)[number];

export const NOMINATION_SOURCES = ["web", "admin", "import"] as const;
export type NominationSource = (typeof NOMINATION_SOURCES)[number];

export const NOMINATION_EVENT_TYPES = [
  "created",
  "invalidated",
  "restored",
  "business_moderated",
  "fraud_flagged",
  "exported",
] as const;

export type NominationEventType = (typeof NOMINATION_EVENT_TYPES)[number];

export const FRAUD_SIGNAL_TYPES = [
  "rapid_fire",
  "duplicate_attempt",
  "turnstile_failure",
  "closed_phase_attempt",
  "cross_community_attempt",
  "unverified_user",
  "manual_review",
] as const;

export type FraudSignalType = (typeof FRAUD_SIGNAL_TYPES)[number];

export type Nomination = {
  id: string;
  campaignId: string;
  campaignCategoryId: string;
  businessLocationId: string | null;
  businessSubmissionRequestId: string | null;
  userId: string;
  verifiedEmailHash: string;
  status: NominationStatus;
  source: NominationSource;
  createdAt: string;
  invalidatedAt: string | null;
  invalidatedBy: string | null;
  invalidationReason: string | null;
};

export type NominationEvent = {
  id: string;
  nominationId: string;
  eventType: NominationEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type FraudSignal = {
  id: string;
  campaignId: string;
  entityType: "nomination" | "user" | "business_location" | "submission" | "vote" | "finalist";
  entityId: string;
  signalType: FraudSignalType;
  riskScore: number;
  metadata: Record<string, unknown>;
  status: "open" | "reviewed" | "dismissed" | "confirmed";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type PublicNominationView = {
  id: string;
  status: NominationStatus;
  createdAt: string;
  categoryName: string;
  categorySlug: string;
  businessName: string | null;
  pendingBusinessName: string | null;
};
