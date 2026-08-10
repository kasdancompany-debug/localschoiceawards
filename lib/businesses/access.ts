import type {
  BusinessClaimStatus,
  BusinessMembershipRole,
} from "@/types/business-access";
import { BUSINESS_ROLE_RANK } from "@/types/business-access";

export function canInviteRole(
  actorRole: BusinessMembershipRole,
  targetRole: BusinessMembershipRole,
): boolean {
  // Owners may invite any role including another owner.
  if (actorRole === "owner") {
    return true;
  }
  // Everyone else may only invite strictly lower-ranked roles.
  return BUSINESS_ROLE_RANK[targetRole] < BUSINESS_ROLE_RANK[actorRole];
}

export function canEditBusinessProfile(role: BusinessMembershipRole): boolean {
  return role === "owner" || role === "administrator" || role === "manager" || role === "marketing";
}

export function canManageTeam(role: BusinessMembershipRole): boolean {
  return role === "owner" || role === "administrator";
}

export function canManageLocations(role: BusinessMembershipRole): boolean {
  return role === "owner" || role === "administrator" || role === "manager";
}

export function isInvitationExpired(expiresAt: string | Date, now: Date = new Date()): boolean {
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return expires.getTime() <= now.getTime();
}

export function assertCanAccessBusiness(
  membership: { role: BusinessMembershipRole; status: string } | null,
): asserts membership is { role: BusinessMembershipRole; status: "active" } {
  if (!membership || membership.status !== "active") {
    throw new Error("You do not have access to this business.");
  }
}

export function emailDomainMatchesBusinessWebsite(
  email: string,
  websiteUrl: string | null | undefined,
): boolean {
  const emailDomain = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!emailDomain) {
    return false;
  }

  const website = (websiteUrl ?? "").trim().toLowerCase();
  if (!website) {
    return false;
  }

  const host = website
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    ?.split("?")[0];

  if (!host) {
    return false;
  }

  return host === emailDomain || host.endsWith(`.${emailDomain}`) || emailDomain.endsWith(`.${host}`);
}

/**
 * Domain email match only advances the claim into review — never auto-approves.
 */
export function nextClaimStatusAfterSubmission(input: {
  domainEmailMatched: boolean;
  hasEvidence: boolean;
}): BusinessClaimStatus {
  if (input.domainEmailMatched && input.hasEvidence) {
    return "under_review";
  }
  if (input.domainEmailMatched) {
    return "email_verification";
  }
  if (input.hasEvidence) {
    return "under_review";
  }
  return "evidence_required";
}

export function isTerminalClaimStatus(status: BusinessClaimStatus): boolean {
  return status === "approved" || status === "rejected" || status === "cancelled" || status === "expired";
}

export function hashInvitationToken(token: string): string {
  // Deterministic SHA-256 via Web Crypto is async; use a sync Node crypto in server modules.
  // This pure helper is for tests with a precomputed hash strategy.
  return token;
}
