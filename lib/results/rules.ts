import {
  RESULT_PLACEMENTS,
  type ResultPlacement,
  type ResultRulesSnapshot,
} from "@/types/results";

export type VoteTallyCandidate = {
  finalistId: string;
  businessLocationId: string;
  validVoteCount: number;
};

export type PlacementAssignment = VoteTallyCandidate & {
  placement: ResultPlacement;
  tied: boolean;
  rank: number;
};

/**
 * Competition ranking (Olympic / "1224"):
 * Tied candidates share a placement; subsequent placements skip accordingly.
 * Example: two tied for platinum → both platinum; next receives silver (gold skipped).
 *
 * Only groups whose shared rank is within 1..4 receive awards.
 * Within equal vote totals, finalist ID ascending is used for stable ordering only
 * (it does not break the tie for placement).
 */
export function assignPlacementsCompetitionRanking(
  candidates: VoteTallyCandidate[],
): PlacementAssignment[] {
  const sorted = [...candidates].sort((a, b) => {
    if (b.validVoteCount !== a.validVoteCount) {
      return b.validVoteCount - a.validVoteCount;
    }
    return a.finalistId.localeCompare(b.finalistId);
  });

  const assignments: PlacementAssignment[] = [];
  let index = 0;
  let rank = 1;

  while (index < sorted.length && rank <= RESULT_PLACEMENTS.length) {
    const count = sorted[index]!.validVoteCount;
    const tiedGroup: VoteTallyCandidate[] = [];
    while (index < sorted.length && sorted[index]!.validVoteCount === count) {
      tiedGroup.push(sorted[index]!);
      index += 1;
    }

    const placement = RESULT_PLACEMENTS[rank - 1];
    if (!placement) {
      break;
    }

    const tied = tiedGroup.length > 1;
    for (const candidate of tiedGroup) {
      assignments.push({
        ...candidate,
        placement,
        tied,
        rank,
      });
    }

    rank += tiedGroup.length;
  }

  return assignments;
}

export function buildResultRulesSnapshot(input: {
  publishExactVoteCounts: boolean;
  computedAt?: string;
}): ResultRulesSnapshot {
  return {
    version: "1.0",
    onlyValidVotes: true,
    placements: [...RESULT_PLACEMENTS],
    tieBreak: "competition_ranking",
    tieBreakDescription:
      "Tied valid-vote totals share a placement. Subsequent placements skip using competition ranking (1224). Within equal totals, finalist ID ascending is used only for stable ordering, not for breaking the tie.",
    maxPlacementSlots: 4,
    publishExactVoteCounts: input.publishExactVoteCounts,
    computedAt: input.computedAt ?? new Date().toISOString(),
  };
}

export function canPublishResultRun(input: {
  status: string;
  hasResults: boolean;
  alreadyHasPublishedRun: boolean;
}): { ok: true } | { ok: false; reason: "not_approved" | "empty" | "publication_locked" } {
  if (input.alreadyHasPublishedRun) {
    return { ok: false, reason: "publication_locked" };
  }
  if (input.status !== "approved") {
    return { ok: false, reason: "not_approved" };
  }
  if (!input.hasResults) {
    return { ok: false, reason: "empty" };
  }
  return { ok: true };
}

export function canApproveResultRun(status: string): boolean {
  return status === "pending_approval";
}

/** Public surfaces hide exact counts unless the campaign/rules allow it. */
export function publicVoteCount(
  validVoteCount: number,
  publishExactVoteCounts: boolean,
): number | null {
  return publishExactVoteCounts ? validVoteCount : null;
}

export function placementLabel(placement: ResultPlacement): string {
  switch (placement) {
    case "platinum":
      return "Platinum";
    case "gold":
      return "Gold";
    case "silver":
      return "Silver";
    case "bronze":
      return "Bronze";
    default:
      return placement;
  }
}
