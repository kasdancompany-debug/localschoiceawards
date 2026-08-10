import { z } from "zod";

import { BUSINESS_SOCIAL_PLATFORMS, BUSINESS_STATUSES } from "@/types/business";

export const businessStatusSchema = z.enum(BUSINESS_STATUSES);

export const businessSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

export const missingBusinessSubmissionSchema = z.object({
  businessName: z.string().trim().min(2, "Enter a business name."),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a valid website URL.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  submitterEmail: z.string().trim().email("Enter a valid email address."),
  turnstileToken: z.string().min(1, "Complete the security check."),
});

export type MissingBusinessSubmissionValues = z.infer<typeof missingBusinessSubmissionSchema>;

export const businessImportRowSchema = z.object({
  legalName: z.string().trim().min(2),
  publicName: z.string().trim().min(2),
  slug: businessSlugSchema.optional(),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  primaryPhone: z.string().trim().max(40).optional().or(z.literal("")),
  primaryEmail: z.string().trim().email().optional().or(z.literal("")),
  locationName: z.string().trim().min(2).optional().or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  administrativeRegionCode: z.string().trim().max(10).optional().or(z.literal("")),
  countryCode: z.enum(["CA", "US"]).optional(),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  websiteLocationUrl: z.string().trim().url().optional().or(z.literal("")),
  serviceAreaBusiness: z.coerce.boolean().optional(),
  categorySlugs: z.array(z.string().trim().min(1)).optional(),
});

export type BusinessImportRowValues = z.infer<typeof businessImportRowSchema>;

export const businessSocialLinkSchema = z.object({
  platform: z.enum(BUSINESS_SOCIAL_PLATFORMS),
  url: z.string().trim().url(),
});

export const businessSearchQuerySchema = z.object({
  q: z.string().trim().max(120).default(""),
  categorySlug: z.string().trim().max(120).optional().or(z.literal("")),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});
