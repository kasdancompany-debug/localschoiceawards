import type { CampaignStateSnapshot } from "@/lib/campaigns/state";

export type VoteRuleFailure =
  | "unverified_user"
  | "voting_closed"
  | "voting_locked"
  | "invalid_finalist"
  | "invalid_category"
  | "cross_community"
  | "finalist_not_published";

export type VoteEligibilityInput = {
  emailConfirmed: boolean;
  campaignState: CampaignStateSnapshot | null;
  votingLocked: boolean;
  categoryBelongsToCampaign: boolean;
  categoryActive: boolean;
  finalistExists: boolean;
  finalistPublished: boolean;
  finalistBelongsToCategory: boolean;
  finalistInCommunity: boolean;
};

export function evaluateVoteEligibility(
  input: VoteEligibilityInput,
): { ok: true } | { ok: false; reason: VoteRuleFailure } {
  if (!input.emailConfirmed) {
    return { ok: false, reason: "unverified_user" };
  }
  if (input.votingLocked) {
    return { ok: false, reason: "voting_locked" };
  }
  if (!input.campaignState || input.campaignState.activePhase !== "voting") {
    return { ok: false, reason: "voting_closed" };
  }
  if (!input.categoryBelongsToCampaign || !input.categoryActive) {
    return { ok: false, reason: "invalid_category" };
  }
  if (!input.finalistExists || !input.finalistBelongsToCategory) {
    return { ok: false, reason: "invalid_finalist" };
  }
  if (!input.finalistPublished) {
    return { ok: false, reason: "finalist_not_published" };
  }
  if (!input.finalistInCommunity) {
    return { ok: false, reason: "cross_community" };
  }
  return { ok: true };
}

export function voteRuleMessage(reason: VoteRuleFailure): string {
  switch (reason) {
    case "unverified_user":
      return "Verify your email before voting.";
    case "voting_closed":
      return "Voting is not open for this campaign.";
    case "voting_locked":
      return "Voting has been locked by administrators.";
    case "invalid_finalist":
      return "That finalist is not eligible for this category.";
    case "invalid_category":
      return "That category is not part of this campaign.";
    case "cross_community":
      return "You can only vote for finalists in this community.";
    case "finalist_not_published":
      return "That finalist is not published for voting.";
    default:
      return "Vote is not allowed.";
  }
}

/** Public surfaces must never show exact vote totals before results publish. */
export function publicVotePresence(count: number): "none" | "voted" {
  return count > 0 ? "voted" : "none";
}

export type FinalistProposalCandidate = {
  businessLocationId: string;
  validNominationCount: number;
};

export type FinalistCategoryRules = {
  finalistLimit: number;
  minimumNominationCount: number;
};

/**
 * Pure selection: eligible businesses by min nominations, ranked, capped by limit.
 * Does not expose counts to callers beyond the ranking input itself (admin-only use).
 */
export function proposeFinalistsFromNominations(
  candidates: FinalistProposalCandidate[],
  rules: FinalistCategoryRules,
): FinalistProposalCandidate[] {
  const eligible = candidates
    .filter((candidate) => candidate.validNominationCount >= rules.minimumNominationCount)
    .sort((a, b) => {
      if (b.validNominationCount !== a.validNominationCount) {
        return b.validNominationCount - a.validNominationCount;
      }
      return a.businessLocationId.localeCompare(b.businessLocationId);
    });

  return eligible.slice(0, Math.max(0, rules.finalistLimit));
}

export function canChangeVote(input: {
  votingOpen: boolean;
  votingLocked: boolean;
  hasActiveVote: boolean;
}): boolean {
  return input.votingOpen && !input.votingLocked && input.hasActiveVote;
}
