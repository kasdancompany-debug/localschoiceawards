export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "nominations_open",
  "nominations_closed",
  "finalist_review",
  "voting_open",
  "voting_closed",
  "auditing",
  "results_scheduled",
  "results_published",
  "archived",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_PHASES = [
  "nomination",
  "finalist_review",
  "voting",
  "audit",
  "results",
] as const;

export type CampaignPhaseKey = (typeof CAMPAIGN_PHASES)[number];

export const CAMPAIGN_PHASE_STATUSES = [
  "scheduled",
  "active",
  "completed",
  "skipped",
  "cancelled",
] as const;

export type CampaignPhaseStatus = (typeof CAMPAIGN_PHASE_STATUSES)[number];

/** Effective public-facing lifecycle derived from stored status + dates. */
export const RESOLVED_CAMPAIGN_STATES = [
  "draft",
  "scheduled",
  "nominations_open",
  "nominations_closed",
  "finalist_review",
  "voting_open",
  "voting_closed",
  "auditing",
  "results_scheduled",
  "results_published",
  "archived",
  "cancelled",
] as const;

export type ResolvedCampaignState = (typeof RESOLVED_CAMPAIGN_STATES)[number];

export type CampaignTemplate = {
  id: string;
  name: string;
  description: string;
  defaultNominationDays: number;
  defaultReviewDays: number;
  defaultVotingDays: number;
  defaultAuditDays: number;
  active: boolean;
};

export type Campaign = {
  id: string;
  communityId: string;
  campaignTemplateId: string | null;
  year: number;
  name: string;
  status: CampaignStatus;
  nominationOpensAt: string;
  nominationClosesAt: string;
  finalistReviewClosesAt: string;
  votingOpensAt: string;
  votingClosesAt: string;
  resultsPublishAt: string;
  timezone: string;
  exactVoteTotalsPublic: boolean;
  votingLockedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignPhase = {
  id: string;
  campaignId: string;
  phase: CampaignPhaseKey;
  startsAt: string;
  endsAt: string;
  status: CampaignPhaseStatus;
};

export type CategoryGroup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  active: boolean;
};

export type MasterCategory = {
  id: string;
  categoryGroupId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  displayOrder: number;
};

export type CampaignCategory = {
  id: string;
  campaignId: string;
  masterCategoryId: string;
  localName: string | null;
  localSlug: string | null;
  localDescription: string | null;
  finalistLimit: number;
  minimumNominationCount: number;
  active: boolean;
  displayOrder: number;
};

export type PublicCampaignCategory = CampaignCategory & {
  displayName: string;
  displaySlug: string;
  displayDescription: string;
  masterName: string;
  masterSlug: string;
  groupName: string;
  groupSlug: string;
};

export type CampaignDateFields = {
  nominationOpensAt: Date | string;
  nominationClosesAt: Date | string;
  finalistReviewClosesAt: Date | string;
  votingOpensAt: Date | string;
  votingClosesAt: Date | string;
  resultsPublishAt: Date | string;
};
