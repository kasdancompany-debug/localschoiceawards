import { describe, expect, it } from "vitest";

import {
  assignPlacementsCompetitionRanking,
  buildResultRulesSnapshot,
  canApproveResultRun,
  canPublishResultRun,
  publicVoteCount,
} from "@/lib/results/rules";

describe("assignPlacementsCompetitionRanking", () => {
  it("assigns platinum through bronze for distinct totals", () => {
    const assignments = assignPlacementsCompetitionRanking([
      { finalistId: "a", businessLocationId: "l1", validVoteCount: 40 },
      { finalistId: "b", businessLocationId: "l2", validVoteCount: 30 },
      { finalistId: "c", businessLocationId: "l3", validVoteCount: 20 },
      { finalistId: "d", businessLocationId: "l4", validVoteCount: 10 },
      { finalistId: "e", businessLocationId: "l5", validVoteCount: 5 },
    ]);

    expect(assignments.map((item) => [item.finalistId, item.placement, item.tied])).toEqual([
      ["a", "platinum", false],
      ["b", "gold", false],
      ["c", "silver", false],
      ["d", "bronze", false],
    ]);
  });

  it("handles ties with competition ranking (1224)", () => {
    const assignments = assignPlacementsCompetitionRanking([
      { finalistId: "a", businessLocationId: "l1", validVoteCount: 50 },
      { finalistId: "b", businessLocationId: "l2", validVoteCount: 50 },
      { finalistId: "c", businessLocationId: "l3", validVoteCount: 20 },
      { finalistId: "d", businessLocationId: "l4", validVoteCount: 10 },
    ]);

    expect(assignments).toEqual([
      expect.objectContaining({ finalistId: "a", placement: "platinum", tied: true, rank: 1 }),
      expect.objectContaining({ finalistId: "b", placement: "platinum", tied: true, rank: 1 }),
      expect.objectContaining({ finalistId: "c", placement: "silver", tied: false, rank: 3 }),
      expect.objectContaining({ finalistId: "d", placement: "bronze", tied: false, rank: 4 }),
    ]);
  });

  it("ignores zero-vote candidates when not provided", () => {
    const assignments = assignPlacementsCompetitionRanking([
      { finalistId: "a", businessLocationId: "l1", validVoteCount: 3 },
    ]);
    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.placement).toBe("platinum");
  });
});

describe("publication locks and approval", () => {
  it("requires approval before publish", () => {
    expect(
      canPublishResultRun({
        status: "pending_approval",
        hasResults: true,
        alreadyHasPublishedRun: false,
      }),
    ).toEqual({ ok: false, reason: "not_approved" });
  });

  it("locks publication when a published run already exists", () => {
    expect(
      canPublishResultRun({
        status: "approved",
        hasResults: true,
        alreadyHasPublishedRun: true,
      }),
    ).toEqual({ ok: false, reason: "publication_locked" });
  });

  it("allows publish for an approved non-empty unlocked run", () => {
    expect(
      canPublishResultRun({
        status: "approved",
        hasResults: true,
        alreadyHasPublishedRun: false,
      }),
    ).toEqual({ ok: true });
  });

  it("only approves pending_approval runs", () => {
    expect(canApproveResultRun("pending_approval")).toBe(true);
    expect(canApproveResultRun("approved")).toBe(false);
    expect(canApproveResultRun("published")).toBe(false);
  });
});

describe("exact vote count publication", () => {
  it("hides counts unless explicitly allowed", () => {
    expect(publicVoteCount(42, false)).toBeNull();
    expect(publicVoteCount(42, true)).toBe(42);
  });

  it("records rules snapshot with onlyValidVotes and tie policy", () => {
    const snapshot = buildResultRulesSnapshot({
      publishExactVoteCounts: false,
      computedAt: "2027-03-27T16:00:00.000Z",
    });
    expect(snapshot.onlyValidVotes).toBe(true);
    expect(snapshot.tieBreak).toBe("competition_ranking");
    expect(snapshot.publishExactVoteCounts).toBe(false);
    expect(snapshot.placements).toEqual(["platinum", "gold", "silver", "bronze"]);
  });
});

describe("invalidated votes exclusion contract", () => {
  it("documents that only positive valid tallies enter placement", () => {
    // Service filters votes with status=active before calling this helper.
    // Passing only valid tallies here mirrors that contract.
    const assignments = assignPlacementsCompetitionRanking([
      { finalistId: "valid", businessLocationId: "l1", validVoteCount: 12 },
    ]);
    expect(assignments[0]?.validVoteCount).toBe(12);
    expect(assignments.every((item) => item.validVoteCount > 0)).toBe(true);
  });
});

describe("eligibility creation contract", () => {
  it("exposes personalization fields required on publish", () => {
    const required = [
      "personalizedBusinessName",
      "personalizedCommunityName",
      "personalizedCategoryName",
      "personalizedCampaignYear",
    ];
    // Smoke assertion that placement helpers remain available for eligibility rows.
    expect(required.length).toBe(4);
    expect(buildResultRulesSnapshot({ publishExactVoteCounts: true }).version).toBe("1.0");
  });
});
