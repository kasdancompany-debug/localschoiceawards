import { z } from "zod";

export const startResultRunSchema = z.object({
  campaignId: z.string().uuid(),
});

export const approveResultRunSchema = z.object({
  resultRunId: z.string().uuid(),
});

export const publishResultRunSchema = z.object({
  resultRunId: z.string().uuid(),
});

export const revokeEligibilitySchema = z.object({
  eligibilityId: z.string().uuid(),
  reason: z.string().trim().min(3).max(1000),
});
