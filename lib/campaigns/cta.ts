import type { CampaignStateSnapshot } from "@/lib/campaigns/state";
import type { ResolvedCampaignState } from "@/types/campaign";
import { toRoute } from "@/lib/routes";
import type { Route } from "next";

export type CampaignPrimaryCta = {
  label: string;
  href: Route | null;
  disabled: boolean;
  tone: "primary" | "secondary" | "muted";
};

const STATUS_LABELS: Record<ResolvedCampaignState, string> = {
  draft: "Draft",
  scheduled: "Launching soon",
  nominations_open: "Nominations open",
  nominations_closed: "Nominations closed",
  finalist_review: "Finalist review",
  voting_open: "Voting open",
  voting_closed: "Voting closed",
  auditing: "Auditing results",
  results_scheduled: "Results coming soon",
  results_published: "Winners published",
  archived: "Season archived",
  cancelled: "Campaign cancelled",
};

export function getCampaignStatusLabel(state: ResolvedCampaignState): string {
  return STATUS_LABELS[state];
}

/**
 * One primary public CTA based on resolved campaign phase.
 * Nomination and voting destinations are placeholders until those flows ship.
 */
export function getCampaignPrimaryCta(
  snapshot: CampaignStateSnapshot | null,
): CampaignPrimaryCta {
  if (!snapshot || !snapshot.canPublicReadCampaign) {
    return {
      label: "Join launch list",
      href: toRoute("#launch-list"),
      disabled: false,
      tone: "primary",
    };
  }

  switch (snapshot.resolvedState) {
    case "scheduled":
      return {
        label: "Join launch list",
        href: toRoute("#launch-list"),
        disabled: false,
        tone: "primary",
      };
    case "nominations_open":
      return {
        label: "Nominate",
        href: toRoute("/nominate"),
        disabled: false,
        tone: "primary",
      };
    case "nominations_closed":
    case "finalist_review":
      return {
        label: "Nominations closed",
        href: null,
        disabled: true,
        tone: "muted",
      };
    case "voting_open":
      return {
        label: "Vote",
        href: toRoute("/vote"),
        disabled: false,
        tone: "primary",
      };
    case "voting_closed":
    case "auditing":
    case "results_scheduled":
      return {
        label: "Voting closed",
        href: null,
        disabled: true,
        tone: "muted",
      };
    case "results_published":
    case "archived":
      return {
        label: "View winners",
        href: toRoute("/winners"),
        disabled: false,
        tone: "primary",
      };
    case "cancelled":
    case "draft":
    default:
      return {
        label: "Join launch list",
        href: toRoute("#launch-list"),
        disabled: false,
        tone: "primary",
      };
  }
}
