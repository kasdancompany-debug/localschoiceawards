import { describe, expect, it } from "vitest";

import {
  compactSearchText,
  filterCommunitySearchRecords,
  groupCommunitiesByRegion,
  isCommunityMarketActive,
  normalizeSearchText,
  sortCommunitySearchRecords,
  type CommunitySearchRecord,
} from "@/lib/communities/search";
import { getCampaignPrimaryCta, getCampaignStatusLabel } from "@/lib/campaigns/cta";
import type { CampaignStateSnapshot } from "@/lib/campaigns/state";

const sample: CommunitySearchRecord[] = [
  {
    id: "1",
    name: "Sault Ste. Marie",
    displayName: "Sault Ste. Marie Locals Choice Awards",
    subdomain: "saultstemarie",
    slug: "sault-ste-marie",
    marketStatus: "preparing",
    isActive: true,
    countryCode: "CA",
    countryName: "Canada",
    regionCode: "ON",
    regionName: "Ontario",
    regionType: "province",
    aliases: ["The Soo", "Sault Ste Marie"],
    url: "http://saultstemarie.localhost:3000",
  },
  {
    id: "2",
    name: "Winnipeg",
    displayName: "Winnipeg Locals Choice Awards",
    subdomain: "winnipeg",
    slug: "winnipeg",
    marketStatus: "planned",
    isActive: false,
    countryCode: "CA",
    countryName: "Canada",
    regionCode: "MB",
    regionName: "Manitoba",
    regionType: "province",
    aliases: ["Peg"],
    url: null,
  },
  {
    id: "3",
    name: "Detroit",
    displayName: "Detroit Locals Choice Awards",
    subdomain: "detroit",
    slug: "detroit",
    marketStatus: "preparing",
    isActive: true,
    countryCode: "US",
    countryName: "United States",
    regionCode: "MI",
    regionName: "Michigan",
    regionType: "state",
    aliases: ["Motor City"],
    url: "http://detroit.localhost:3000",
  },
];

describe("community search normalization", () => {
  it("ignores punctuation and case", () => {
    expect(normalizeSearchText("Sault Ste. Marie!")).toBe("sault ste marie");
    expect(compactSearchText("Sault Ste. Marie!")).toBe("saultstemarie");
  });

  it("matches aliases and compact subdomain forms", () => {
    const byAlias = filterCommunitySearchRecords(sample, "the soo");
    expect(byAlias.map((item) => item.subdomain)).toEqual(["saultstemarie"]);

    const byCompact = filterCommunitySearchRecords(sample, "saultstemarie");
    expect(byCompact[0]?.name).toBe("Sault Ste. Marie");

    const byPeg = filterCommunitySearchRecords(sample, "Peg");
    expect(byPeg[0]?.subdomain).toBe("winnipeg");
  });

  it("orders active communities before planned ones", () => {
    const sorted = sortCommunitySearchRecords(sample);
    expect(sorted.map((item) => item.subdomain)).toEqual([
      "detroit",
      "saultstemarie",
      "winnipeg",
    ]);
    expect(isCommunityMarketActive("planned")).toBe(false);
    expect(isCommunityMarketActive("preparing")).toBe(true);
  });

  it("groups by province or state", () => {
    const groups = groupCommunitiesByRegion(sample);
    expect(groups.map((group) => group.regionCode).sort()).toEqual(["MB", "MI", "ON"]);
  });
});

describe("campaign primary CTA", () => {
  function snapshot(
    resolvedState: CampaignStateSnapshot["resolvedState"],
  ): CampaignStateSnapshot {
    return {
      storedStatus: resolvedState === "draft" ? "draft" : "scheduled",
      resolvedState,
      canPublicReadCampaign: resolvedState !== "draft" && resolvedState !== "cancelled",
      canPublicReadResults:
        resolvedState === "results_published" || resolvedState === "archived",
      canPublicReadExactVoteTotals: false,
      votingLocked: false,
      activePhase: "none",
    };
  }

  it("maps phases to the expected public CTA labels", () => {
    expect(getCampaignPrimaryCta(snapshot("scheduled")).label).toBe("Join launch list");
    expect(getCampaignPrimaryCta(snapshot("nominations_open")).label).toBe("Nominate");
    expect(getCampaignPrimaryCta(snapshot("nominations_closed")).label).toBe(
      "Nominations closed",
    );
    expect(getCampaignPrimaryCta(snapshot("voting_open")).label).toBe("Vote");
    expect(getCampaignPrimaryCta(snapshot("voting_closed")).label).toBe("Voting closed");
    expect(getCampaignPrimaryCta(snapshot("results_published")).label).toBe("View winners");
    expect(getCampaignStatusLabel("voting_open")).toBe("Voting open");
  });
});
