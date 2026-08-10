import { addDays, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

import { validateCampaignDates } from "@/lib/validation/campaigns";
import type { CampaignDateFields, CampaignTemplate } from "@/types/campaign";

export type TemplateScheduleInput = {
  template: Pick<
    CampaignTemplate,
    | "defaultNominationDays"
    | "defaultReviewDays"
    | "defaultVotingDays"
    | "defaultAuditDays"
  >;
  /** Local wall time in the community timezone, e.g. 2027-01-12T09:00 */
  nominationOpensAtLocal: string;
  timezone: string;
};

function parseLocalDateTime(local: string, timezone: string): Date {
  const normalized = local.includes("T") ? local : `${local}T09:00:00`;
  const parsed = parse(normalized, "yyyy-MM-dd'T'HH:mm:ss", new Date(0));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid local campaign datetime: ${local}`);
  }
  return fromZonedTime(parsed, timezone);
}

/**
 * Builds a campaign schedule from template day counts in the community timezone.
 */
export function buildScheduleFromTemplate(input: TemplateScheduleInput): CampaignDateFields {
  const nominationOpensAt = parseLocalDateTime(input.nominationOpensAtLocal, input.timezone);

  const nominationClosesAt = addDays(
    nominationOpensAt,
    input.template.defaultNominationDays,
  );
  // Close at end of the close day in community TZ by using same clock time minus 1s conceptually —
  // keep simple day offsets; exact wall-clock close can be adjusted by admins.
  const finalistReviewClosesAt = addDays(
    nominationClosesAt,
    input.template.defaultReviewDays,
  );
  const votingOpensAt = finalistReviewClosesAt;
  const votingClosesAt = addDays(votingOpensAt, input.template.defaultVotingDays);
  const resultsPublishAt = addDays(votingClosesAt, input.template.defaultAuditDays);

  const schedule = {
    nominationOpensAt,
    nominationClosesAt,
    finalistReviewClosesAt,
    votingOpensAt,
    votingClosesAt,
    resultsPublishAt,
  };

  const validation = validateCampaignDates(schedule);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  return schedule;
}

export function toIsoSchedule(schedule: CampaignDateFields) {
  return {
    nominationOpensAt: new Date(schedule.nominationOpensAt).toISOString(),
    nominationClosesAt: new Date(schedule.nominationClosesAt).toISOString(),
    finalistReviewClosesAt: new Date(schedule.finalistReviewClosesAt).toISOString(),
    votingOpensAt: new Date(schedule.votingOpensAt).toISOString(),
    votingClosesAt: new Date(schedule.votingClosesAt).toISOString(),
    resultsPublishAt: new Date(schedule.resultsPublishAt).toISOString(),
  };
}
