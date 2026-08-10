import { z } from "zod";

import { CAMPAIGN_STATUSES } from "@/types/campaign";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export type CampaignDateValidationResult = {
  ok: boolean;
  errors: string[];
};

/**
 * Validates campaign schedule chronology.
 * All comparisons use absolute instants (timestamptz); callers supply times
 * already expressed for the community timezone.
 */
export function validateCampaignDates(input: {
  nominationOpensAt: Date | string;
  nominationClosesAt: Date | string;
  finalistReviewClosesAt: Date | string;
  votingOpensAt: Date | string;
  votingClosesAt: Date | string;
  resultsPublishAt: Date | string;
}): CampaignDateValidationResult {
  const nominationOpensAt = toDate(input.nominationOpensAt);
  const nominationClosesAt = toDate(input.nominationClosesAt);
  const finalistReviewClosesAt = toDate(input.finalistReviewClosesAt);
  const votingOpensAt = toDate(input.votingOpensAt);
  const votingClosesAt = toDate(input.votingClosesAt);
  const resultsPublishAt = toDate(input.resultsPublishAt);

  const errors: string[] = [];
  const dates = [
    nominationOpensAt,
    nominationClosesAt,
    finalistReviewClosesAt,
    votingOpensAt,
    votingClosesAt,
    resultsPublishAt,
  ];

  if (dates.some((date) => Number.isNaN(date.getTime()))) {
    return { ok: false, errors: ["All campaign dates must be valid timestamps."] };
  }

  if (!(nominationOpensAt < nominationClosesAt)) {
    errors.push("Nomination open must be before nomination close.");
  }
  if (!(nominationClosesAt <= finalistReviewClosesAt)) {
    errors.push("Nomination close must be on or before finalist review close.");
  }
  if (!(finalistReviewClosesAt <= votingOpensAt)) {
    errors.push("Finalist review close must be on or before voting open.");
  }
  if (!(votingOpensAt < votingClosesAt)) {
    errors.push("Voting open must be before voting close.");
  }
  if (!(votingClosesAt <= resultsPublishAt)) {
    errors.push("Voting close must be on or before results publish.");
  }

  return { ok: errors.length === 0, errors };
}

export const campaignStatusSchema = z.enum(CAMPAIGN_STATUSES);

export const createCampaignFromTemplateSchema = z.object({
  communityId: z.string().uuid(),
  templateId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  name: z.string().trim().min(3).max(160),
  nominationOpensAtLocal: z.string().min(1),
  timezone: z.string().min(1),
  publishImmediately: z.boolean().default(false),
  includeInactiveMasterCategories: z.boolean().default(false),
});

export type CreateCampaignFromTemplateValues = z.infer<typeof createCampaignFromTemplateSchema>;

export const campaignCategoryLocalSchema = z
  .object({
    localName: z.string().trim().min(1).max(160).nullable().optional(),
    localSlug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.")
      .nullable()
      .optional(),
    localDescription: z.string().trim().max(2000).nullable().optional(),
    active: z.boolean(),
    finalistLimit: z.number().int().min(1).max(50),
    minimumNominationCount: z.number().int().min(0).max(1000),
    displayOrder: z.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.localName && !value.localSlug) {
      ctx.addIssue({
        code: "custom",
        path: ["localSlug"],
        message: "Provide a local slug when setting a local category name.",
      });
    }
  });

export type CampaignCategoryLocalValues = z.infer<typeof campaignCategoryLocalSchema>;

/** Ensures campaign category local slugs are unique within a campaign (case-insensitive). */
export function findDuplicateCampaignCategorySlugs(
  categories: Array<{ id?: string; localSlug: string | null | undefined; active?: boolean }>,
): string[] {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const category of categories) {
    if (!category.localSlug) {
      continue;
    }
    const key = category.localSlug.trim().toLowerCase();
    const owner = seen.get(key);
    if (owner && owner !== (category.id ?? key)) {
      duplicates.add(key);
    } else {
      seen.set(key, category.id ?? key);
    }
  }

  return [...duplicates];
}

export const allowedCampaignStatusTransitions: Record<
  (typeof CAMPAIGN_STATUSES)[number],
  Array<(typeof CAMPAIGN_STATUSES)[number]>
> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["nominations_open", "draft", "cancelled"],
  nominations_open: ["nominations_closed", "cancelled"],
  nominations_closed: ["finalist_review", "cancelled"],
  finalist_review: ["voting_open", "cancelled"],
  voting_open: ["voting_closed", "cancelled"],
  voting_closed: ["auditing", "cancelled"],
  auditing: ["results_scheduled", "results_published", "cancelled"],
  results_scheduled: ["results_published", "cancelled"],
  results_published: ["archived"],
  archived: [],
  cancelled: [],
};

export function canTransitionCampaignStatus(
  from: (typeof CAMPAIGN_STATUSES)[number],
  to: (typeof CAMPAIGN_STATUSES)[number],
): boolean {
  if (from === to) {
    return true;
  }
  return allowedCampaignStatusTransitions[from].includes(to);
}
