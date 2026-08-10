import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  assertCanAccessBusiness,
  canEditBusinessProfile,
  canInviteRole,
  canManageLocations,
  canManageTeam,
  emailDomainMatchesBusinessWebsite,
  isInvitationExpired,
  nextClaimStatusAfterSubmission,
} from "@/lib/businesses/access";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { sendBusinessClaimStatusEmail, sendBusinessInvitationEmail } from "@/lib/email/business";
import { env } from "@/lib/env/server";
import type {
  BusinessClaim,
  BusinessClaimStatus,
  BusinessInvitation,
  BusinessMembership,
  BusinessMembershipRole,
} from "@/types/business-access";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

function mapMembership(row: {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessMembershipRole;
  status: BusinessMembership["status"];
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}): BusinessMembership {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClaim(row: {
  id: string;
  business_id: string;
  business_location_id: string | null;
  requested_by_user_id: string;
  verification_method: BusinessClaim["verificationMethod"];
  submitted_email: string;
  evidence_storage_path: string | null;
  status: BusinessClaimStatus;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  expires_at: string;
  domain_email_matched: boolean;
}): BusinessClaim {
  return {
    id: row.id,
    businessId: row.business_id,
    businessLocationId: row.business_location_id,
    requestedByUserId: row.requested_by_user_id,
    verificationMethod: row.verification_method,
    submittedEmail: row.submitted_email,
    evidenceStoragePath: row.evidence_storage_path,
    status: row.status,
    reviewerId: row.reviewer_id,
    reviewerNotes: row.reviewer_notes,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at,
    expiresAt: row.expires_at,
    domainEmailMatched: row.domain_email_matched,
  };
}

export async function listMembershipsForUser(userId: string): Promise<
  Array<BusinessMembership & { businessName: string; businessSlug: string }>
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_memberships")
    .select("*, businesses!inner(public_name, slug, deleted_at)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error || !data) {
    return [];
  }

  return data.flatMap((row) => {
    const business = row.businesses as unknown as {
      public_name: string;
      slug: string;
      deleted_at: string | null;
    };
    if (business.deleted_at) {
      return [];
    }
    return [
      {
        ...mapMembership(row),
        businessName: business.public_name,
        businessSlug: business.slug,
      },
    ];
  });
}

export async function getActiveMembership(
  businessId: string,
  userId: string,
): Promise<BusinessMembership | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("business_memberships")
    .select("*")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return data ? mapMembership(data) : null;
}

export async function requireBusinessMembership(
  businessId: string,
  userId: string,
  options?: { edit?: boolean; team?: boolean; locations?: boolean },
): Promise<BusinessMembership> {
  const membership = await getActiveMembership(businessId, userId);
  assertCanAccessBusiness(membership);

  if (options?.edit && !canEditBusinessProfile(membership.role)) {
    throw new Error("You do not have permission to edit this business.");
  }
  if (options?.team && !canManageTeam(membership.role)) {
    throw new Error("You do not have permission to manage the team.");
  }
  if (options?.locations && !canManageLocations(membership.role)) {
    throw new Error("You do not have permission to manage locations.");
  }

  return membership;
}

export async function createBusinessClaim(input: {
  businessId: string;
  businessLocationId?: string | null;
  requestedByUserId: string;
  verificationMethod: BusinessClaim["verificationMethod"];
  submittedEmail: string;
  evidenceStoragePath?: string | null;
  notes?: string | null;
}): Promise<BusinessClaim> {
  const supabase = createSupabaseAdminClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id, public_name, website_url, deleted_at")
    .eq("id", input.businessId)
    .maybeSingle();

  if (!business || business.deleted_at) {
    throw new Error("Business not found.");
  }

  const domainMatched = emailDomainMatchesBusinessWebsite(
    input.submittedEmail,
    business.website_url,
  );
  // Public email domain match never auto-approves.
  const status = nextClaimStatusAfterSubmission({
    domainEmailMatched: domainMatched,
    hasEvidence: Boolean(input.evidenceStoragePath),
  });

  const { data, error } = await supabase
    .from("business_claims")
    .insert({
      business_id: input.businessId,
      business_location_id: input.businessLocationId || null,
      requested_by_user_id: input.requestedByUserId,
      verification_method: input.verificationMethod,
      submitted_email: input.submittedEmail,
      evidence_storage_path: input.evidenceStoragePath || null,
      status,
      domain_email_matched: domainMatched,
      reviewer_notes: input.notes || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create claim.");
  }

  await supabase.from("business_claim_status_events").insert({
    claim_id: data.id,
    from_status: null,
    to_status: status,
    actor_user_id: input.requestedByUserId,
    notes: input.notes || "Claim submitted",
  });

  await sendBusinessClaimStatusEmail({
    to: input.submittedEmail,
    businessName: business.public_name,
    status,
    claimId: data.id,
    userId: input.requestedByUserId,
    notes: domainMatched
      ? "Your email domain matches this business website. An admin still needs to review and approve the claim."
      : "Please upload evidence if you have not already. An admin will review your claim.",
  });

  return mapClaim(data);
}

export async function transitionBusinessClaimStatus(input: {
  claimId: string;
  toStatus: BusinessClaimStatus;
  actorUserId: string;
  reviewerNotes?: string | null;
}): Promise<BusinessClaim> {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error } = await supabase
    .from("business_claims")
    .select("*")
    .eq("id", input.claimId)
    .maybeSingle();

  if (error || !existing) {
    throw new Error("Claim not found.");
  }

  const fromStatus = existing.status as BusinessClaimStatus;
  const { data, error: updateError } = await supabase
    .from("business_claims")
    .update({
      status: input.toStatus,
      reviewer_id: input.actorUserId,
      reviewer_notes: input.reviewerNotes ?? existing.reviewer_notes,
      reviewed_at:
        input.toStatus === "approved" || input.toStatus === "rejected"
          ? new Date().toISOString()
          : existing.reviewed_at,
    })
    .eq("id", input.claimId)
    .select("*")
    .single();

  if (updateError || !data) {
    throw new Error(updateError?.message ?? "Unable to update claim.");
  }

  await supabase.from("business_claim_status_events").insert({
    claim_id: input.claimId,
    from_status: fromStatus,
    to_status: input.toStatus,
    actor_user_id: input.actorUserId,
    notes: input.reviewerNotes || null,
  });

  if (input.toStatus === "approved") {
    await supabase.from("business_memberships").upsert(
      {
        business_id: existing.business_id,
        user_id: existing.requested_by_user_id,
        role: "owner",
        status: "active",
        invited_by: input.actorUserId,
      },
      { onConflict: "business_id,user_id" },
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("public_name")
    .eq("id", existing.business_id)
    .maybeSingle();

  await sendBusinessClaimStatusEmail({
    to: existing.submitted_email,
    businessName: business?.public_name ?? "your business",
    status: input.toStatus,
    claimId: input.claimId,
    userId: existing.requested_by_user_id,
    notes: input.reviewerNotes || undefined,
  });

  return mapClaim(data);
}

export async function listClaimsForAdmin(status?: BusinessClaimStatus): Promise<BusinessClaim[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("business_claims")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(100);
  if (status) {
    query = query.eq("status", status);
  }
  const { data } = await query;
  return (data ?? []).map(mapClaim);
}

export async function inviteBusinessMember(input: {
  businessId: string;
  email: string;
  role: BusinessMembershipRole;
  invitedByUserId: string;
  actorRole: BusinessMembershipRole;
}): Promise<{ invitation: BusinessInvitation; token: string }> {
  if (!canInviteRole(input.actorRole, input.role)) {
    throw new Error("You cannot invite a role at or above your privilege level.");
  }

  const { token, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("business_invitations")
    .insert({
      business_id: input.businessId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      token_hash: tokenHash,
      invited_by: input.invitedByUserId,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create invitation.");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("public_name")
    .eq("id", input.businessId)
    .maybeSingle();

  const acceptUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/business/invitations/accept?token=${token}`;
  // Prefer business subdomain when configured.
  const root = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const protocol = root.includes("localhost") ? "http" : "https";
  const businessAcceptUrl = `${protocol}://business.${root}/invitations/accept?token=${token}`;

  await sendBusinessInvitationEmail({
    to: input.email,
    businessName: business?.public_name ?? "a Locals Choice Awards business",
    role: input.role,
    acceptUrl: businessAcceptUrl || acceptUrl,
    expiresAt,
    invitationId: data.id,
    invitedByUserId: input.invitedByUserId,
  });

  return {
    invitation: {
      id: data.id,
      businessId: data.business_id,
      email: data.email,
      role: data.role,
      tokenHash: data.token_hash,
      invitedBy: data.invited_by,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at,
      createdAt: data.created_at,
    },
    token,
  };
}

export async function acceptBusinessInvitation(input: {
  token: string;
  userId: string;
  userEmail: string;
}): Promise<BusinessMembership> {
  const tokenHash = hashToken(input.token);
  const supabase = createSupabaseAdminClient();
  const { data: invitation, error } = await supabase
    .from("business_invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !invitation) {
    throw new Error("Invitation not found.");
  }
  if (invitation.accepted_at) {
    throw new Error("Invitation already accepted.");
  }
  if (isInvitationExpired(invitation.expires_at)) {
    throw new Error("Invitation has expired.");
  }
  if (invitation.email.toLowerCase() !== input.userEmail.toLowerCase()) {
    throw new Error("Sign in with the invited email address to accept.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_memberships")
    .upsert(
      {
        business_id: invitation.business_id,
        user_id: input.userId,
        role: invitation.role,
        status: "active",
        invited_by: invitation.invited_by,
      },
      { onConflict: "business_id,user_id" },
    )
    .select("*")
    .single();

  if (membershipError || !membership) {
    throw new Error(membershipError?.message ?? "Unable to accept invitation.");
  }

  await supabase
    .from("business_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return mapMembership(membership);
}

export async function listTeamForBusiness(businessId: string): Promise<BusinessMembership[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("business_memberships")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at");
  return (data ?? []).map(mapMembership);
}

export async function listInvitationsForBusiness(businessId: string): Promise<BusinessInvitation[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("business_invitations")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    email: row.email,
    role: row.role,
    tokenHash: row.token_hash,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }));
}

export async function getManagedBusiness(businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}
