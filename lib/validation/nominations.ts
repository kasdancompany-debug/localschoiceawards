import { z } from "zod";

export const createNominationSchema = z.object({
  campaignCategoryId: z.string().uuid(),
  businessLocationId: z.string().uuid().optional().or(z.literal("")),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type CreateNominationValues = z.infer<typeof createNominationSchema>;

export const suggestMissingBusinessNominationSchema = z.object({
  campaignCategoryId: z.string().uuid(),
  businessName: z.string().trim().min(2).max(200),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: "Enter a valid website URL.",
    }),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type SuggestMissingBusinessNominationValues = z.infer<
  typeof suggestMissingBusinessNominationSchema
>;

export const invalidateNominationSchema = z.object({
  nominationId: z.string().uuid(),
  reason: z.string().trim().min(3).max(1000),
});

export const reviewFraudSignalSchema = z.object({
  signalId: z.string().uuid(),
  status: z.enum(["reviewed", "dismissed", "confirmed"]),
});
