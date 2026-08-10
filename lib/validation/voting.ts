import { z } from "zod";

export const castVoteSchema = z.object({
  campaignCategoryId: z.string().uuid(),
  finalistId: z.string().uuid(),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type CastVoteValues = z.infer<typeof castVoteSchema>;

export const invalidateVoteSchema = z.object({
  voteId: z.string().uuid(),
  reason: z.string().trim().min(3).max(1000),
});

export const generateFinalistsSchema = z.object({
  campaignId: z.string().uuid(),
  campaignCategoryId: z.string().uuid().optional().or(z.literal("")),
});

export const reviewFinalistSchema = z.object({
  finalistId: z.string().uuid(),
  action: z.enum(["approve", "remove", "publish"]),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const manualAddFinalistSchema = z.object({
  campaignId: z.string().uuid(),
  campaignCategoryId: z.string().uuid(),
  businessLocationId: z.string().uuid(),
  notes: z.string().trim().min(3).max(1000),
});

export const publishFinalistsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const lockVotingSchema = z.object({
  campaignId: z.string().uuid(),
  lock: z.enum(["true", "false"]),
});
