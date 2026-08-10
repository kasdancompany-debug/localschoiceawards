import { formatInTimeZone } from "date-fns-tz";

import type { Campaign } from "@/types/campaign";

export type CampaignDeadlineItem = {
  id: string;
  label: string;
  at: string;
  formatted: string;
};

export function formatCampaignInstant(
  value: string | Date,
  timezone: string,
  pattern = "MMM d, yyyy · h:mm a zzz",
): string {
  const date = value instanceof Date ? value : new Date(value);
  return formatInTimeZone(date, timezone, pattern);
}

export function getCampaignDeadlines(campaign: Campaign): CampaignDeadlineItem[] {
  const tz = campaign.timezone;
  return [
    {
      id: "nomination-opens",
      label: "Nominations open",
      at: campaign.nominationOpensAt,
      formatted: formatCampaignInstant(campaign.nominationOpensAt, tz),
    },
    {
      id: "nomination-closes",
      label: "Nominations close",
      at: campaign.nominationClosesAt,
      formatted: formatCampaignInstant(campaign.nominationClosesAt, tz),
    },
    {
      id: "voting-opens",
      label: "Voting opens",
      at: campaign.votingOpensAt,
      formatted: formatCampaignInstant(campaign.votingOpensAt, tz),
    },
    {
      id: "voting-closes",
      label: "Voting closes",
      at: campaign.votingClosesAt,
      formatted: formatCampaignInstant(campaign.votingClosesAt, tz),
    },
    {
      id: "results",
      label: "Results publish",
      at: campaign.resultsPublishAt,
      formatted: formatCampaignInstant(campaign.resultsPublishAt, tz),
    },
  ];
}
