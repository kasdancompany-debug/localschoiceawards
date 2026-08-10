export const FINALIST_STATUSES = [
  "proposed",
  "approved",
  "published",
  "removed",
] as const;

export type FinalistStatus = (typeof FINALIST_STATUSES)[number];

export const FINALIST_SELECTION_METHODS = ["automatic", "manual"] as const;
export type FinalistSelectionMethod = (typeof FINALIST_SELECTION_METHODS)[number];

export const VOTE_STATUSES = ["active", "invalidated"] as const;
export type VoteStatus = (typeof VOTE_STATUSES)[number];

export const VOTE_EVENT_TYPES = [
  "created",
  "changed",
  "invalidated",
  "restored",
  "fraud_flagged",
  "exported",
] as const;

export type VoteEventType = (typeof VOTE_EVENT_TYPES)[number];

export type Finalist = {
  id: string;
  campaignId: string;
  campaignCategoryId: string;
  businessLocationId: string;
  nominationCountSnapshot: number | null;
  selectionMethod: FinalistSelectionMethod;
  status: FinalistStatus;
  selectedAt: string | null;
  selectedBy: string | null;
  adminNotes: string | null;
  removalReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Vote = {
  id: string;
  campaignId: string;
  campaignCategoryId: string;
  finalistId: string;
  userId: string;
  verifiedEmailHash: string;
  status: VoteStatus;
  createdAt: string;
  updatedAt: string;
  invalidatedAt: string | null;
  invalidatedBy: string | null;
  invalidationReason: string | null;
};

export type VoteEvent = {
  id: string;
  voteId: string;
  eventType: VoteEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PublicFinalistView = {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  groupName: string;
  businessName: string;
  businessSlug: string;
  locationName: string;
  logoUrl: string | null;
};

export type PublicVoteProgress = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  voted: boolean;
  selectedFinalistId: string | null;
};
