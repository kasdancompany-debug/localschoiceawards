import { describe, expect, it } from "vitest";

import { resolveCampaignState } from "@/lib/campaigns/state";
import {
  canChangeVote,
  evaluateVoteEligibility,
  proposeFinalistsFromNominations,
  publicVotePresence,
  voteRuleMessage,
} from "@/lib/voting/rules";
import { evaluateRateLimitWindow } from "@/lib/security/rate-limit-policy";
import type { Campaign } from "@/types/campaign";

function campaignFixture(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "camp-1",
    communityId: "comm-1",
    campaignTemplateId: "tmpl-1",
    year: 2027,
    name: "Test Campaign 2027",
    status: "scheduled",
    nominationOpensAt: "2027-01-12T14:00:00.000Z",
    nominationClosesAt: "2027-02-10T04:59:59.000Z",
    finalistReviewClosesAt: "2027-02-24T04:59:59.000Z",
    votingOpensAt: "2027-02-24T14:00:00.000Z",
    votingClosesAt: "2027-03-18T03:59:59.000Z",
    resultsPublishAt: "2027-03-27T16:00:00.000Z",
    timezone: "America/Toronto",
    exactVoteTotalsPublic: false,
    votingLockedAt: null,
    publishedAt: "2026-03-01T00:00:00.000Z",
    archivedAt: null,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
}

function openVotingState(overrides: Partial<Campaign> = {}) {
  return resolveCampaignState(campaignFixture(overrides), "2027-03-01T12:00:00.000Z");
}

function closedVotingState() {
  return resolveCampaignState(campaignFixture(), "2027-03-20T12:00:00.000Z");
}

const validBase = {
  emailConfirmed: true,
  categoryBelongsToCampaign: true,
  categoryActive: true,
  finalistExists: true,
  finalistPublished: true,
  finalistBelongsToCategory: true,
  finalistInCommunity: true,
  votingLocked: false,
};

describe("voting eligibility rules", () => {
  it("rejects unverified users", () => {
    const result = evaluateVoteEligibility({
      ...validBase,
      emailConfirmed: false,
      campaignState: openVotingState(),
    });
    expect(result).toEqual({ ok: false, reason: "unverified_user" });
  });

  it("rejects closed voting phase", () => {
    const result = evaluateVoteEligibility({
      ...validBase,
      campaignState: closedVotingState(),
    });
    expect(result).toEqual({ ok: false, reason: "voting_closed" });
  });

  it("rejects locked voting", () => {
    const state = openVotingState({ votingLockedAt: "2027-03-01T00:00:00.000Z" });
    const result = evaluateVoteEligibility({
      ...validBase,
      campaignState: state,
      votingLocked: true,
    });
    expect(result).toEqual({ ok: false, reason: "voting_locked" });
    expect(state.activePhase).not.toBe("voting");
  });

  it("rejects unpublished finalists", () => {
    const result = evaluateVoteEligibility({
      ...validBase,
      campaignState: openVotingState(),
      finalistPublished: false,
    });
    expect(result).toEqual({ ok: false, reason: "finalist_not_published" });
  });

  it("rejects invalid finalists", () => {
    const result = evaluateVoteEligibility({
      ...validBase,
      campaignState: openVotingState(),
      finalistExists: false,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_finalist" });
  });

  it("rejects invalid categories", () => {
    const result = evaluateVoteEligibility({
      ...validBase,
      campaignState: openVotingState(),
      categoryBelongsToCampaign: false,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_category" });
  });

  it("rejects cross-community finalists", () => {
    const result = evaluateVoteEligibility({
      ...validBase,
      campaignState: openVotingState(),
      finalistInCommunity: false,
    });
    expect(result).toEqual({ ok: false, reason: "cross_community" });
  });

  it("allows a valid vote", () => {
    const result = evaluateVoteEligibility({
      ...validBase,
      campaignState: openVotingState(),
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("vote change and presence helpers", () => {
  it("permits changing votes while open and unlocked", () => {
    expect(
      canChangeVote({ votingOpen: true, votingLocked: false, hasActiveVote: true }),
    ).toBe(true);
    expect(
      canChangeVote({ votingOpen: false, votingLocked: false, hasActiveVote: true }),
    ).toBe(false);
    expect(
      canChangeVote({ votingOpen: true, votingLocked: true, hasActiveVote: true }),
    ).toBe(false);
  });

  it("never exposes exact public vote totals", () => {
    expect(publicVotePresence(0)).toBe("none");
    expect(publicVotePresence(1)).toBe("voted");
    expect(publicVotePresence(500)).toBe("voted");
  });

  it("rate-limits vote actions", () => {
    expect(evaluateRateLimitWindow(40, "vote").allowed).toBe(false);
    expect(evaluateRateLimitWindow(2, "vote").allowed).toBe(true);
  });

  it("returns human-readable rule messages", () => {
    expect(voteRuleMessage("voting_closed")).toMatch(/not open/i);
    expect(voteRuleMessage("cross_community")).toMatch(/this community/i);
  });
});

describe("finalist proposal rules", () => {
  it("respects minimum nomination count and finalist limit", () => {
    const proposed = proposeFinalistsFromNominations(
      [
        { businessLocationId: "a", validNominationCount: 10 },
        { businessLocationId: "b", validNominationCount: 2 },
        { businessLocationId: "c", validNominationCount: 8 },
        { businessLocationId: "d", validNominationCount: 1 },
      ],
      { finalistLimit: 2, minimumNominationCount: 3 },
    );
    expect(proposed.map((item) => item.businessLocationId)).toEqual(["a", "c"]);
  });

  it("returns empty when nobody meets the minimum", () => {
    const proposed = proposeFinalistsFromNominations(
      [{ businessLocationId: "a", validNominationCount: 1 }],
      { finalistLimit: 5, minimumNominationCount: 3 },
    );
    expect(proposed).toEqual([]);
  });
});
