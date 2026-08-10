import type {
  Campaign,
  CampaignStatus,
  ResolvedCampaignState,
} from "@/types/campaign";

export type CampaignStateSnapshot = {
  storedStatus: CampaignStatus;
  resolvedState: ResolvedCampaignState;
  canPublicReadCampaign: boolean;
  canPublicReadResults: boolean;
  canPublicReadExactVoteTotals: boolean;
  votingLocked: boolean;
  activePhase:
    | "none"
    | "nomination"
    | "finalist_review"
    | "voting"
    | "audit"
    | "results";
};

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Resolves the effective campaign state from persisted status and schedule dates.
 * Dates are absolute timestamptz values created in the community timezone.
 */
export function resolveCampaignState(
  campaign: Pick<
    Campaign,
    | "status"
    | "nominationOpensAt"
    | "nominationClosesAt"
    | "finalistReviewClosesAt"
    | "votingOpensAt"
    | "votingClosesAt"
    | "resultsPublishAt"
    | "exactVoteTotalsPublic"
    | "votingLockedAt"
    | "publishedAt"
    | "archivedAt"
  >,
  nowInput: Date | string = new Date(),
): CampaignStateSnapshot {
  const now = toDate(nowInput);
  const storedStatus = campaign.status;
  const votingLocked = Boolean(campaign.votingLockedAt);

  if (storedStatus === "cancelled") {
    return {
      storedStatus,
      resolvedState: "cancelled",
      canPublicReadCampaign: false,
      canPublicReadResults: false,
      canPublicReadExactVoteTotals: false,
      votingLocked,
      activePhase: "none",
    };
  }

  if (storedStatus === "draft" || !campaign.publishedAt) {
    return {
      storedStatus,
      resolvedState: "draft",
      canPublicReadCampaign: false,
      canPublicReadResults: false,
      canPublicReadExactVoteTotals: false,
      votingLocked,
      activePhase: "none",
    };
  }

  if (storedStatus === "archived" || campaign.archivedAt) {
    return {
      storedStatus: "archived",
      resolvedState: "archived",
      canPublicReadCampaign: true,
      canPublicReadResults: true,
      canPublicReadExactVoteTotals: campaign.exactVoteTotalsPublic,
      votingLocked,
      activePhase: "results",
    };
  }

  const nominationOpensAt = toDate(campaign.nominationOpensAt);
  const nominationClosesAt = toDate(campaign.nominationClosesAt);
  const finalistReviewClosesAt = toDate(campaign.finalistReviewClosesAt);
  const votingOpensAt = toDate(campaign.votingOpensAt);
  const votingClosesAt = toDate(campaign.votingClosesAt);
  const resultsPublishAt = toDate(campaign.resultsPublishAt);

  let resolvedState: ResolvedCampaignState = "scheduled";
  let activePhase: CampaignStateSnapshot["activePhase"] = "none";

  if (now < nominationOpensAt) {
    resolvedState = "scheduled";
    activePhase = "none";
  } else if (now <= nominationClosesAt) {
    resolvedState = "nominations_open";
    activePhase = "nomination";
  } else if (now < votingOpensAt) {
    resolvedState = now <= finalistReviewClosesAt ? "finalist_review" : "nominations_closed";
    activePhase = "finalist_review";
  } else if (now <= votingClosesAt) {
    resolvedState = votingLocked ? "voting_closed" : "voting_open";
    activePhase = votingLocked ? "audit" : "voting";
  } else if (now < resultsPublishAt) {
    resolvedState =
      storedStatus === "results_scheduled" ? "results_scheduled" : "auditing";
    activePhase = "audit";
  } else {
    resolvedState = "results_published";
    activePhase = "results";
  }

  // Manual terminal/admin statuses win when they are more advanced than date inference.
  if (storedStatus === "results_published" || storedStatus === "results_scheduled") {
    resolvedState = storedStatus;
  }
  if (storedStatus === "auditing" && resolvedState !== "results_published") {
    resolvedState = "auditing";
    activePhase = "audit";
  }
  if (storedStatus === "voting_closed" && activePhase === "voting") {
    resolvedState = "voting_closed";
    activePhase = "audit";
  }

  const canPublicReadResults =
    resolvedState === "results_published" || now >= resultsPublishAt;

  return {
    storedStatus,
    resolvedState,
    canPublicReadCampaign: true,
    canPublicReadResults,
    canPublicReadExactVoteTotals:
      canPublicReadResults && campaign.exactVoteTotalsPublic === true,
    votingLocked,
    activePhase: resolvedState === "results_published" ? "results" : activePhase,
  };
}

export function assertCanReadCampaignResults(snapshot: CampaignStateSnapshot): void {
  if (!snapshot.canPublicReadResults) {
    throw new Error("Campaign results are not available until publication.");
  }
}
