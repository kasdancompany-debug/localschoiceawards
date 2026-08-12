import { describe, expect, it } from "vitest";

import {
  assertNoVoterChoiceLeak,
  canCompareCommunities,
  canViewBusinessAnalytics,
  canViewCommunityAnalytics,
  contributionMarginCents,
  filterBusinessMetricsRows,
  productConversionRate,
  sanitizeAnalyticsProperties,
  shippingMarginCents,
} from "@/lib/analytics/rules";

describe("analytics access control", () => {
  it("allows business members only for their own business metrics", () => {
    const actor = {
      kind: "business_member" as const,
      userId: "user-1",
      businessIds: ["biz-a", "biz-b"],
    };

    expect(canViewBusinessAnalytics({ actor, businessId: "biz-a" })).toBe(true);
    expect(canViewBusinessAnalytics({ actor, businessId: "biz-c" })).toBe(false);
    expect(canViewCommunityAnalytics({ actor })).toBe(false);
    expect(canCompareCommunities({ actor })).toBe(false);

    expect(
      filterBusinessMetricsRows({
        actor,
        rows: [
          { businessId: "biz-a", views: 10 },
          { businessId: "biz-c", views: 99 },
        ],
      }),
    ).toEqual([{ businessId: "biz-a", views: 10 }]);
  });

  it("lets admins compare communities and view any business aggregate", () => {
    const actor = { kind: "admin" as const, userId: "admin-1" };
    expect(canViewBusinessAnalytics({ actor, businessId: "anyone" })).toBe(true);
    expect(canViewCommunityAnalytics({ actor })).toBe(true);
    expect(canCompareCommunities({ actor })).toBe(true);
  });

  it("never exposes individual voter choices in sanitized properties", () => {
    const sanitized = sanitizeAnalyticsProperties({
      source: "web",
      vote_choice: "finalist-123",
      selectedFinalistId: "finalist-123",
      voterId: "user-9",
      page: "profile",
    });

    expect(sanitized).toEqual({ source: "web", page: "profile" });
    expect(assertNoVoterChoiceLeak(sanitized)).toEqual({ ok: true });
    expect(
      assertNoVoterChoiceLeak({
        voteChoice: "secret",
      }),
    ).toEqual({ ok: false, leakedKeys: ["voteChoice"] });
  });
});

describe("financial analytics helpers", () => {
  it("separates shipping margin from contribution margin", () => {
    expect(
      shippingMarginCents({
        shippingCollectedCents: 1500,
        supplierShippingCostCents: 900,
      }),
    ).toBe(600);

    expect(
      contributionMarginCents({
        revenueCents: 17400,
        manufacturingCostCents: 7000,
        supplierShippingCostCents: 900,
        stripeFeeCents: 500,
        refundCents: 0,
      }),
    ).toBe(9000);
  });

  it("tracks winner-product conversion rate", () => {
    expect(productConversionRate({ winnerBusinesses: 10, buyers: 4 })).toBe(40);
    expect(productConversionRate({ winnerBusinesses: 0, buyers: 2 })).toBe(0);
  });
});
