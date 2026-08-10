export const BUSINESS_MEMBERSHIP_ROLES = [
  "owner",
  "administrator",
  "manager",
  "marketing",
  "viewer",
] as const;

export type BusinessMembershipRole = (typeof BUSINESS_MEMBERSHIP_ROLES)[number];

export const BUSINESS_MEMBERSHIP_STATUSES = [
  "active",
  "invited",
  "suspended",
  "revoked",
] as const;

export type BusinessMembershipStatus = (typeof BUSINESS_MEMBERSHIP_STATUSES)[number];

export const BUSINESS_CLAIM_STATUSES = [
  "pending",
  "email_verification",
  "evidence_required",
  "under_review",
  "approved",
  "rejected",
  "cancelled",
  "expired",
] as const;

export type BusinessClaimStatus = (typeof BUSINESS_CLAIM_STATUSES)[number];

export const BUSINESS_CLAIM_VERIFICATION_METHODS = [
  "domain_email",
  "manual_evidence",
  "admin_assisted",
] as const;

export type BusinessClaimVerificationMethod =
  (typeof BUSINESS_CLAIM_VERIFICATION_METHODS)[number];

/** Higher number = more privilege. Used to prevent escalation. */
export const BUSINESS_ROLE_RANK: Record<BusinessMembershipRole, number> = {
  viewer: 1,
  marketing: 2,
  manager: 3,
  administrator: 4,
  owner: 5,
};

export type BusinessMembership = {
  id: string;
  businessId: string;
  userId: string;
  role: BusinessMembershipRole;
  status: BusinessMembershipStatus;
  invitedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessInvitation = {
  id: string;
  businessId: string;
  email: string;
  role: BusinessMembershipRole;
  tokenHash: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type BusinessClaim = {
  id: string;
  businessId: string;
  businessLocationId: string | null;
  requestedByUserId: string;
  verificationMethod: BusinessClaimVerificationMethod;
  submittedEmail: string;
  evidenceStoragePath: string | null;
  status: BusinessClaimStatus;
  reviewerId: string | null;
  reviewerNotes: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  expiresAt: string;
  domainEmailMatched: boolean;
};

export type BusinessClaimStatusEvent = {
  id: string;
  claimId: string;
  fromStatus: BusinessClaimStatus | null;
  toStatus: BusinessClaimStatus;
  actorUserId: string | null;
  notes: string | null;
  createdAt: string;
};
