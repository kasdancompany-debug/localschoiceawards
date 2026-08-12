"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession, requireUser } from "@/lib/auth/session";
import {
  acceptBusinessInvitation,
  createBusinessClaim,
  inviteBusinessMember,
  requireBusinessMembership,
  transitionBusinessClaimStatus,
} from "@/lib/businesses/memberships";
import {
  replaceBusinessHours,
  replaceBusinessSocialLinks,
  updateManagedBusinessProfile,
} from "@/lib/businesses/management";
import { createBusinessMediaUploadUrl, registerBusinessMedia } from "@/lib/businesses/storage";
import {
  acceptBusinessInvitationSchema,
  createBusinessClaimSchema,
  inviteBusinessMemberSchema,
  reviewBusinessClaimSchema,
  updateBusinessHoursSchema,
  updateBusinessProfileSchema,
  updateBusinessSocialLinksSchema,
} from "@/lib/validation/business-access";
import type { BusinessClaimStatus } from "@/types/business-access";

export type PortalActionState = {
  ok: boolean;
  message?: string;
};

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function submitBusinessClaimAction(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const session = await requireUser({ next: "/claims/new" });
  const parsed = createBusinessClaimSchema.safeParse({
    businessId: formData.get("businessId"),
    businessLocationId: formData.get("businessLocationId") || "",
    verificationMethod: formData.get("verificationMethod"),
    submittedEmail: formData.get("submittedEmail"),
    evidenceStoragePath: formData.get("evidenceStoragePath") || "",
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  try {
    await createBusinessClaim({
      businessId: parsed.data.businessId,
      businessLocationId: parsed.data.businessLocationId || null,
      requestedByUserId: session.userId,
      verificationMethod: parsed.data.verificationMethod,
      submittedEmail: parsed.data.submittedEmail,
      evidenceStoragePath: parsed.data.evidenceStoragePath || null,
      notes: parsed.data.notes || null,
    });
    revalidatePath("/businesses");
    return { ok: true, message: "Claim submitted for review." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Claim failed." };
  }
}

export async function reviewBusinessClaimAction(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const session = await requireAdminSession("/admin/claims");
  const parsed = reviewBusinessClaimSchema.safeParse({
    claimId: formData.get("claimId"),
    status: formData.get("status"),
    reviewerNotes: formData.get("reviewerNotes") || "",
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  try {
    await transitionBusinessClaimStatus({
      claimId: parsed.data.claimId,
      toStatus: parsed.data.status as BusinessClaimStatus,
      actorUserId: session.userId,
      reviewerNotes: parsed.data.reviewerNotes || null,
    });
    revalidatePath("/admin/claims");
    return { ok: true, message: "Claim updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function inviteTeamMemberAction(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const session = await requireUser({ next: "/businesses" });
  const parsed = inviteBusinessMemberSchema.safeParse({
    businessId: formData.get("businessId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  try {
    const membership = await requireBusinessMembership(parsed.data.businessId, session.userId, {
      team: true,
    });
    await inviteBusinessMember({
      businessId: parsed.data.businessId,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedByUserId: session.userId,
      actorRole: membership.role,
    });
    revalidatePath(`/business/businesses/${parsed.data.businessId}/team`);
    return { ok: true, message: "Invitation sent." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invite failed." };
  }
}

export async function acceptInvitationAction(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const session = await requireUser({ next: "/invitations/accept" });
  const parsed = acceptBusinessInvitationSchema.safeParse({
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  try {
    const membership = await acceptBusinessInvitation({
      token: parsed.data.token,
      userId: session.userId,
      userEmail: session.email,
    });
    revalidatePath("/businesses");
    return {
      ok: true,
      message: `Joined business as ${membership.role}.`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Accept failed." };
  }
}

export async function updateBusinessProfileAction(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const session = await requireUser({ next: "/businesses" });
  const parsed = updateBusinessProfileSchema.safeParse({
    businessId: formData.get("businessId"),
    publicName: formData.get("publicName"),
    description: formData.get("description"),
    websiteUrl: formData.get("websiteUrl") || "",
    primaryPhone: formData.get("primaryPhone") || "",
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  try {
    await updateManagedBusinessProfile({
      userId: session.userId,
      ...parsed.data,
    });
    revalidatePath(`/business/businesses/${parsed.data.businessId}/profile`);
    return { ok: true, message: "Profile updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function updateBusinessHoursAction(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const session = await requireUser({ next: "/businesses" });
  const businessId = String(formData.get("businessId") ?? "");
  const businessLocationId = String(formData.get("businessLocationId") ?? "");
  const rawEntries = String(formData.get("entriesJson") ?? "[]");

  let entries: unknown;
  try {
    entries = JSON.parse(rawEntries);
  } catch {
    return { ok: false, message: "Invalid hours payload." };
  }

  const parsed = updateBusinessHoursSchema.safeParse({ businessLocationId, entries });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  try {
    await replaceBusinessHours({
      userId: session.userId,
      businessId,
      businessLocationId: parsed.data.businessLocationId,
      entries: parsed.data.entries,
    });
    revalidatePath(`/business/businesses/${businessId}/locations`);
    return { ok: true, message: "Hours updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function updateBusinessSocialAction(
  _prev: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const session = await requireUser({ next: "/businesses" });
  const businessId = String(formData.get("businessId") ?? "");
  const rawLinks = String(formData.get("linksJson") ?? "[]");
  let links: unknown;
  try {
    links = JSON.parse(rawLinks);
  } catch {
    return { ok: false, message: "Invalid social links payload." };
  }

  const parsed = updateBusinessSocialLinksSchema.safeParse({ businessId, links });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  try {
    await replaceBusinessSocialLinks({
      userId: session.userId,
      businessId: parsed.data.businessId,
      links: parsed.data.links,
    });
    revalidatePath(`/business/businesses/${businessId}/profile`);
    return { ok: true, message: "Social links updated." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Update failed." };
  }
}

export async function createManagedMediaUploadAction(input: {
  businessId: string;
  filename: string;
  contentType: string;
}) {
  const session = await requireUser({ next: "/businesses" });
  await requireBusinessMembership(input.businessId, session.userId, { edit: true });
  return createBusinessMediaUploadUrl(input);
}

export async function registerManagedMediaAction(input: {
  businessId: string;
  storagePath: string;
  mediaType: "logo" | "photo" | "cover";
  altText?: string;
}) {
  const session = await requireUser({ next: "/businesses" });
  await requireBusinessMembership(input.businessId, session.userId, { edit: true });
  try {
    const id = await registerBusinessMedia({ ...input, approve: true });
    revalidatePath(`/business/businesses/${input.businessId}/assets`);
    return { id };
  } catch (error) {
    return {
      id: null,
      message: error instanceof Error ? error.message : "Unable to register media.",
    };
  }
}
