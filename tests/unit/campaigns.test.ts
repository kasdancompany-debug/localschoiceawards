import { describe, expect, it } from "vitest";

import { buildScheduleFromTemplate } from "@/lib/campaigns/schedule";
import {
  assertCanReadCampaignResults,
  resolveCampaignState,
} from "@/lib/campaigns/state";
import {
  canTransitionCampaignStatus,
  findDuplicateCampaignCategorySlugs,
  validateCampaignDates,
} from "@/lib/validation/campaigns";
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

describe("validateCampaignDates", () => {
  it("accepts a chronological schedule", () => {
    const result = validateCampaignDates({
      nominationOpensAt: "2027-01-01T00:00:00.000Z",
      nominationClosesAt: "2027-01-31T00:00:00.000Z",
      finalistReviewClosesAt: "2027-02-14T00:00:00.000Z",
      votingOpensAt: "2027-02-14T00:00:00.000Z",
      votingClosesAt: "2027-03-07T00:00:00.000Z",
      resultsPublishAt: "2027-03-17T00:00:00.000Z",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects overlapping or reversed windows", () => {
    const result = validateCampaignDates({
      nominationOpensAt: "2027-02-01T00:00:00.000Z",
      nominationClosesAt: "2027-01-01T00:00:00.000Z",
      finalistReviewClosesAt: "2027-02-14T00:00:00.000Z",
      votingOpensAt: "2027-02-14T00:00:00.000Z",
      votingClosesAt: "2027-03-07T00:00:00.000Z",
      resultsPublishAt: "2027-03-17T00:00:00.000Z",
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/Nomination open/i);
  });

  it("rejects results publish before voting closes", () => {
    const result = validateCampaignDates({
      nominationOpensAt: "2027-01-01T00:00:00.000Z",
      nominationClosesAt: "2027-01-31T00:00:00.000Z",
      finalistReviewClosesAt: "2027-02-14T00:00:00.000Z",
      votingOpensAt: "2027-02-14T00:00:00.000Z",
      votingClosesAt: "2027-03-07T00:00:00.000Z",
      resultsPublishAt: "2027-03-01T00:00:00.000Z",
    });
    expect(result.ok).toBe(false);
  });
});

describe("resolveCampaignState", () => {
  it("keeps unpublished drafts private", () => {
    const state = resolveCampaignState(
      campaignFixture({ status: "draft", publishedAt: null }),
      "2027-02-01T00:00:00.000Z",
    );
    expect(state.canPublicReadCampaign).toBe(false);
    expect(state.resolvedState).toBe("draft");
  });

  it("resolves nominations and voting from dates", () => {
    const nominations = resolveCampaignState(
      campaignFixture(),
      "2027-01-20T00:00:00.000Z",
    );
    expect(nominations.resolvedState).toBe("nominations_open");
    expect(nominations.activePhase).toBe("nomination");

    const voting = resolveCampaignState(campaignFixture(), "2027-03-01T00:00:00.000Z");
    expect(voting.resolvedState).toBe("voting_open");
    expect(voting.activePhase).toBe("voting");
  });

  it("blocks public results before publication", () => {
    const before = resolveCampaignState(campaignFixture(), "2027-03-20T00:00:00.000Z");
    expect(before.canPublicReadResults).toBe(false);
    expect(() => assertCanReadCampaignResults(before)).toThrow(/not available/i);

    const after = resolveCampaignState(campaignFixture(), "2027-03-28T00:00:00.000Z");
    expect(after.canPublicReadResults).toBe(true);
    expect(after.canPublicReadExactVoteTotals).toBe(false);
  });

  it("allows exact totals only when published and flagged", () => {
    const state = resolveCampaignState(
      campaignFixture({ exactVoteTotalsPublic: true }),
      "2027-03-28T00:00:00.000Z",
    );
    expect(state.canPublicReadExactVoteTotals).toBe(true);
  });
});

describe("campaign status transitions", () => {
  it("allows the happy-path progression", () => {
    expect(canTransitionCampaignStatus("draft", "scheduled")).toBe(true);
    expect(canTransitionCampaignStatus("scheduled", "nominations_open")).toBe(true);
    expect(canTransitionCampaignStatus("voting_closed", "auditing")).toBe(true);
    expect(canTransitionCampaignStatus("results_published", "archived")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransitionCampaignStatus("draft", "voting_open")).toBe(false);
    expect(canTransitionCampaignStatus("archived", "draft")).toBe(false);
    expect(canTransitionCampaignStatus("cancelled", "scheduled")).toBe(false);
  });
});

describe("campaign category uniqueness", () => {
  it("detects duplicate local slugs within a campaign", () => {
    const duplicates = findDuplicateCampaignCategorySlugs([
      { id: "1", localSlug: "best-pizza" },
      { id: "2", localSlug: "Best-Pizza" },
      { id: "3", localSlug: "best-burger" },
    ]);
    expect(duplicates).toEqual(["best-pizza"]);
  });

  it("ignores null local slugs", () => {
    expect(
      findDuplicateCampaignCategorySlugs([
        { id: "1", localSlug: null },
        { id: "2", localSlug: null },
      ]),
    ).toEqual([]);
  });
});

describe("buildScheduleFromTemplate", () => {
  it("creates a valid community-timezone schedule from template day counts", () => {
    const schedule = buildScheduleFromTemplate({
      template: {
        defaultNominationDays: 28,
        defaultReviewDays: 14,
        defaultVotingDays: 21,
        defaultAuditDays: 10,
      },
      nominationOpensAtLocal: "2027-01-12T09:00:00",
      timezone: "America/Toronto",
    });

    const validation = validateCampaignDates(schedule);
    expect(validation.ok).toBe(true);
    expect(new Date(schedule.nominationOpensAt).toISOString()).toContain("2027-01-12");
  });
});
