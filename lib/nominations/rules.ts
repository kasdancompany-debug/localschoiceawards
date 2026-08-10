import type { CampaignStateSnapshot } from "@/lib/campaigns/state";
import type { NominationStatus } from "@/types/nomination";

export type NominationRuleFailure =
  | "unverified_user"
  | "nominations_closed"
  | "invalid_business"
  | "invalid_category"
  | "cross_community"
  | "duplicate_nomination"
  | "missing_target";

export type NominationEligibilityInput = {
  emailConfirmed: boolean;
  campaignState: CampaignStateSnapshot | null;
  categoryBelongsToCampaign: boolean;
  categoryActive: boolean;
  businessLocationInCommunity: boolean;
  businessApproved: boolean;
  businessLocationActive: boolean;
  hasExistingActiveNomination: boolean;
  hasBusinessLocation: boolean;
  hasMissingBusinessSubmission: boolean;
};

export function evaluateNominationEligibility(
  input: NominationEligibilityInput,
): { ok: true } | { ok: false; reason: NominationRuleFailure } {
  if (!input.emailConfirmed) {
    return { ok: false, reason: "unverified_user" };
  }
  if (!input.campaignState || input.campaignState.activePhase !== "nomination") {
    return { ok: false, reason: "nominations_closed" };
  }
  if (!input.categoryBelongsToCampaign || !input.categoryActive) {
    return { ok: false, reason: "invalid_category" };
  }
  if (!input.hasBusinessLocation && !input.hasMissingBusinessSubmission) {
    return { ok: false, reason: "missing_target" };
  }
  if (input.hasBusinessLocation) {
    if (!input.businessLocationInCommunity) {
      return { ok: false, reason: "cross_community" };
    }
    if (!input.businessApproved || !input.businessLocationActive) {
      return { ok: false, reason: "invalid_business" };
    }
  }
  if (input.hasExistingActiveNomination) {
    return { ok: false, reason: "duplicate_nomination" };
  }
  return { ok: true };
}

export function nominationStatusForTarget(hasApprovedLocation: boolean): NominationStatus {
  return hasApprovedLocation ? "valid" : "pending_business_moderation";
}

export function nominationRuleMessage(reason: NominationRuleFailure): string {
  switch (reason) {
    case "unverified_user":
      return "Verify your email before nominating.";
    case "nominations_closed":
      return "Nominations are not open for this campaign.";
    case "invalid_business":
      return "That business is not eligible for nominations.";
    case "invalid_category":
      return "That category is not part of this campaign.";
    case "cross_community":
      return "You can only nominate businesses in this community.";
    case "duplicate_nomination":
      return "You already nominated this business in this category.";
    case "missing_target":
      return "Choose a business or suggest a missing business.";
    default:
      return "Nomination is not allowed.";
  }
}

/** Public surfaces must never show exact nomination counts. */
export function publicNominationPresence(count: number): "none" | "nominated" {
  return count > 0 ? "nominated" : "none";
}
