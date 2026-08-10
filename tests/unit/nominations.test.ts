import { describe, expect, it } from "vitest";

import { resolveCampaignState } from "@/lib/campaigns/state";
import {
  evaluateNominationEligibility,
  nominationStatusForTarget,
  publicNominationPresence,
} from "@/lib/nominations/rules";
import { hashVerifiedEmail } from "@/lib/nominations/privacy";
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

function openNominationState() {
  return resolveCampaignState(campaignFixture(), "2027-01-20T12:00:00.000Z");
}

function closedNominationState() {
  return resolveCampaignState(campaignFixture(), "2027-02-15T12:00:00.000Z");
}

describe("nomination eligibility rules", () => {
  it("rejects unverified users", () => {
    const result = evaluateNominationEligibility({
      emailConfirmed: false,
      campaignState: openNominationState(),
      categoryBelongsToCampaign: true,
      categoryActive: true,
      businessLocationInCommunity: true,
      businessApproved: true,
      businessLocationActive: true,
      hasExistingActiveNomination: false,
      hasBusinessLocation: true,
      hasMissingBusinessSubmission: false,
    });
    expect(result).toEqual({ ok: false, reason: "unverified_user" });
  });

  it("rejects closed campaigns", () => {
    const result = evaluateNominationEligibility({
      emailConfirmed: true,
      campaignState: closedNominationState(),
      categoryBelongsToCampaign: true,
      categoryActive: true,
      businessLocationInCommunity: true,
      businessApproved: true,
      businessLocationActive: true,
      hasExistingActiveNomination: false,
      hasBusinessLocation: true,
      hasMissingBusinessSubmission: false,
    });
    expect(result).toEqual({ ok: false, reason: "nominations_closed" });
  });

  it("rejects invalid businesses", () => {
    const result = evaluateNominationEligibility({
      emailConfirmed: true,
      campaignState: openNominationState(),
      categoryBelongsToCampaign: true,
      categoryActive: true,
      businessLocationInCommunity: true,
      businessApproved: false,
      businessLocationActive: true,
      hasExistingActiveNomination: false,
      hasBusinessLocation: true,
      hasMissingBusinessSubmission: false,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_business" });
  });

  it("rejects invalid categories", () => {
    const result = evaluateNominationEligibility({
      emailConfirmed: true,
      campaignState: openNominationState(),
      categoryBelongsToCampaign: false,
      categoryActive: true,
      businessLocationInCommunity: true,
      businessApproved: true,
      businessLocationActive: true,
      hasExistingActiveNomination: false,
      hasBusinessLocation: true,
      hasMissingBusinessSubmission: false,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_category" });
  });

  it("rejects cross-community businesses", () => {
    const result = evaluateNominationEligibility({
      emailConfirmed: true,
      campaignState: openNominationState(),
      categoryBelongsToCampaign: true,
      categoryActive: true,
      businessLocationInCommunity: false,
      businessApproved: true,
      businessLocationActive: true,
      hasExistingActiveNomination: false,
      hasBusinessLocation: true,
      hasMissingBusinessSubmission: false,
    });
    expect(result).toEqual({ ok: false, reason: "cross_community" });
  });

  it("rejects duplicate nominations", () => {
    const result = evaluateNominationEligibility({
      emailConfirmed: true,
      campaignState: openNominationState(),
      categoryBelongsToCampaign: true,
      categoryActive: true,
      businessLocationInCommunity: true,
      businessApproved: true,
      businessLocationActive: true,
      hasExistingActiveNomination: true,
      hasBusinessLocation: true,
      hasMissingBusinessSubmission: false,
    });
    expect(result).toEqual({ ok: false, reason: "duplicate_nomination" });
  });

  it("allows a valid nomination", () => {
    const result = evaluateNominationEligibility({
      emailConfirmed: true,
      campaignState: openNominationState(),
      categoryBelongsToCampaign: true,
      categoryActive: true,
      businessLocationInCommunity: true,
      businessApproved: true,
      businessLocationActive: true,
      hasExistingActiveNomination: false,
      hasBusinessLocation: true,
      hasMissingBusinessSubmission: false,
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("nomination helpers", () => {
  it("marks missing-business nominations as pending moderation", () => {
    expect(nominationStatusForTarget(false)).toBe("pending_business_moderation");
    expect(nominationStatusForTarget(true)).toBe("valid");
  });

  it("never exposes exact public totals", () => {
    expect(publicNominationPresence(0)).toBe("none");
    expect(publicNominationPresence(1)).toBe("nominated");
    expect(publicNominationPresence(999)).toBe("nominated");
  });

  it("hashes emails for privacy-conscious storage", () => {
    const a = hashVerifiedEmail("Person@Example.com");
    const b = hashVerifiedEmail("person@example.com");
    expect(a).toBe(b);
    expect(a).not.toContain("@");
    expect(a).toHaveLength(64);
  });

  it("rate-limits nomination actions", () => {
    expect(evaluateRateLimitWindow(20, "nominate").allowed).toBe(false);
    expect(evaluateRateLimitWindow(3, "nominate").allowed).toBe(true);
  });
});
