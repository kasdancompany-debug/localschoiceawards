import { z } from "zod";

export const communitySearchQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

export type CommunitySearchQuery = z.infer<typeof communitySearchQuerySchema>;

export const communityRequestSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  communityName: z.string().trim().min(2, "Enter a community name."),
  region: z.string().trim().min(2, "Enter a province, territory, or state."),
  country: z.enum(["CA", "US"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type CommunityRequestValues = z.infer<typeof communityRequestSchema>;

export const launchListSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").optional().or(z.literal("")),
  communityId: z.string().min(1),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type LaunchListValues = z.infer<typeof launchListSchema>;
