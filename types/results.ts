export const RESULT_PLACEMENTS = ["platinum", "gold", "silver", "bronze"] as const;
export type ResultPlacement = (typeof RESULT_PLACEMENTS)[number];

export const RESULT_RUN_STATUSES = [
  "draft",
  "computing",
  "pending_approval",
  "approved",
  "published",
  "superseded",
  "cancelled",
] as const;
export type ResultRunStatus = (typeof RESULT_RUN_STATUSES)[number];

export const AWARD_ELIGIBILITY_STATUSES = ["active", "revoked"] as const;
export type AwardEligibilityStatus = (typeof AWARD_ELIGIBILITY_STATUSES)[number];

export const AWARD_ASSET_TYPES = [
  "badge_png",
  "square_svg",
  "story_svg",
  "certificate_pdf",
  "qr_png",
] as const;
export type AwardAssetType = (typeof AWARD_ASSET_TYPES)[number];

export type ResultRulesSnapshot = {
  version: "1.0";
  onlyValidVotes: true;
  placements: ResultPlacement[];
  tieBreak: "competition_ranking";
  tieBreakDescription: string;
  maxPlacementSlots: 4;
  publishExactVoteCounts: boolean;
  computedAt: string;
};

export type ResultRun = {
  id: string;
  campaignId: string;
  status: ResultRunStatus;
  rulesSnapshot: ResultRulesSnapshot | Record<string, unknown>;
  startedBy: string | null;
  startedAt: string;
  completedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResultRow = {
  id: string;
  resultRunId: string;
  campaignId: string;
  campaignCategoryId: string;
  finalistId: string;
  businessLocationId: string;
  validVoteCount: number;
  placement: ResultPlacement;
  tied: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AwardEligibility = {
  id: string;
  resultId: string;
  businessId: string;
  businessLocationId: string;
  campaignId: string;
  campaignCategoryId: string;
  placement: ResultPlacement;
  eligibilityStatus: AwardEligibilityStatus;
  personalizedBusinessName: string;
  personalizedCommunityName: string;
  personalizedCategoryName: string;
  personalizedCampaignYear: number;
  createdAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
};

export type AwardAsset = {
  id: string;
  awardEligibilityId: string;
  assetType: AwardAssetType;
  storagePath: string;
  contentType: string;
  createdAt: string;
};

export type PublicWinnerView = {
  resultId: string;
  /** Active award eligibility id when present — used for public trophy ordering. */
  eligibilityId?: string | null;
  placement: ResultPlacement;
  tied: boolean;
  validVoteCount: number | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  groupName: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  locationName: string;
  logoUrl: string | null;
  campaignYear: number;
};
