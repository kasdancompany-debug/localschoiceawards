import { z } from "zod";

import {
  BUSINESS_CLAIM_STATUSES,
  BUSINESS_CLAIM_VERIFICATION_METHODS,
  BUSINESS_MEMBERSHIP_ROLES,
} from "@/types/business-access";
import { BUSINESS_SOCIAL_PLATFORMS } from "@/types/business";

export const businessMembershipRoleSchema = z.enum(BUSINESS_MEMBERSHIP_ROLES);
export const businessClaimStatusSchema = z.enum(BUSINESS_CLAIM_STATUSES);

export const createBusinessClaimSchema = z.object({
  businessId: z.string().uuid(),
  businessLocationId: z.string().uuid().optional().or(z.literal("")),
  verificationMethod: z.enum(BUSINESS_CLAIM_VERIFICATION_METHODS),
  submittedEmail: z.string().trim().email(),
  evidenceStoragePath: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateBusinessClaimValues = z.infer<typeof createBusinessClaimSchema>;

export const reviewBusinessClaimSchema = z.object({
  claimId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "under_review", "evidence_required"]),
  reviewerNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ReviewBusinessClaimValues = z.infer<typeof reviewBusinessClaimSchema>;

export const inviteBusinessMemberSchema = z.object({
  businessId: z.string().uuid(),
  email: z.string().trim().email(),
  role: businessMembershipRoleSchema,
});

export type InviteBusinessMemberValues = z.infer<typeof inviteBusinessMemberSchema>;

export const acceptBusinessInvitationSchema = z.object({
  token: z.string().min(20),
});

export const updateBusinessProfileSchema = z.object({
  businessId: z.string().uuid(),
  publicName: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  primaryPhone: z.string().trim().max(40).optional().or(z.literal("")),
});

export type UpdateBusinessProfileValues = z.infer<typeof updateBusinessProfileSchema>;

export const updateBusinessHoursSchema = z.object({
  businessLocationId: z.string().uuid(),
  entries: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      opensAt: z.string().optional().or(z.literal("")),
      closesAt: z.string().optional().or(z.literal("")),
      closed: z.boolean(),
      appointmentOnly: z.boolean(),
    }),
  ),
});

export const updateBusinessSocialLinksSchema = z.object({
  businessId: z.string().uuid(),
  links: z.array(
    z.object({
      platform: z.enum(BUSINESS_SOCIAL_PLATFORMS),
      url: z.string().trim().url(),
    }),
  ),
});
