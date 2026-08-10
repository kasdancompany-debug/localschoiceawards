import { describe, expect, it } from "vitest";

import {
  assertCampaignRecipientAllowed,
  buildDedupeKey,
  canRetryEvent,
  nextRetryAt,
  preferenceGateForTemplate,
  shouldSendForPreferences,
} from "@/lib/notifications/rules";
import type { NotificationPreferences } from "@/types/notifications";

const basePrefs = (overrides: Partial<NotificationPreferences> = {}): NotificationPreferences => ({
  id: "pref-1",
  userId: "user-1",
  campaignUpdates: true,
  businessUpdates: true,
  orderUpdates: true,
  marketingEmails: false,
  winnerSalesEmails: false,
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("notification deduplication keys", () => {
  it("normalizes recipient email and includes sequence key", () => {
    expect(
      buildDedupeKey({
        eventType: "commerce.order_shipped",
        aggregateId: "order-1",
        recipientEmail: "  Owner@Example.com ",
        sequenceKey: "commerce.order_shipped",
      }),
    ).toBe("commerce.order_shipped:order-1:owner@example.com:commerce.order_shipped");
  });

  it("produces distinct keys for different sequence steps", () => {
    const day0 = buildDedupeKey({
      eventType: "winner.sales.day0",
      aggregateId: "biz-1",
      recipientEmail: "a@example.com",
      sequenceKey: "winner-sales-day0",
    });
    const day3 = buildDedupeKey({
      eventType: "winner.sales.day3",
      aggregateId: "biz-1",
      recipientEmail: "a@example.com",
      sequenceKey: "winner-sales-day3",
    });
    expect(day0).not.toEqual(day3);
  });
});

describe("notification preferences", () => {
  it("never blocks transactional order emails", () => {
    expect(
      shouldSendForPreferences({
        templateKey: "commerce.payment_confirmed",
        category: "transactional",
        preferences: basePrefs({ orderUpdates: false, marketingEmails: false }),
      }),
    ).toEqual({ ok: true });

    expect(preferenceGateForTemplate("commerce.order_shipped")).toBe("always");
  });

  it("blocks marketing and winner sales without consent", () => {
    expect(
      shouldSendForPreferences({
        templateKey: "commerce.cart_reminder",
        category: "marketing",
        preferences: basePrefs({ marketingEmails: false }),
      }),
    ).toEqual({ ok: false, reason: "marketing_opt_out" });

    expect(
      shouldSendForPreferences({
        templateKey: "winner.day3_products",
        category: "marketing",
        preferences: basePrefs({ marketingEmails: true, winnerSalesEmails: false }),
      }),
    ).toEqual({ ok: false, reason: "marketing_opt_out" });

    expect(
      shouldSendForPreferences({
        templateKey: "winner.day0_congrats",
        category: "marketing",
        preferences: basePrefs({ marketingEmails: true, winnerSalesEmails: true }),
      }),
    ).toEqual({ ok: true });
  });

  it("respects campaign and business operational toggles", () => {
    expect(
      shouldSendForPreferences({
        templateKey: "campaign.voting_opened",
        category: "operational",
        preferences: basePrefs({ campaignUpdates: false }),
      }),
    ).toEqual({ ok: false, reason: "preference_disabled" });

    expect(
      shouldSendForPreferences({
        templateKey: "business.claim_approved",
        category: "operational",
        preferences: basePrefs({ businessUpdates: false }),
      }),
    ).toEqual({ ok: false, reason: "preference_disabled" });
  });

  it("keeps team invitations always on", () => {
    expect(
      shouldSendForPreferences({
        templateKey: "business.team_invitation",
        category: "operational",
        preferences: basePrefs({ businessUpdates: false }),
      }),
    ).toEqual({ ok: true });
  });

  it("blocks scraped public emails from campaigns", () => {
    expect(
      assertCampaignRecipientAllowed({
        hasMarketingConsent: true,
        source: "scraped_public",
      }),
    ).toEqual({ ok: false, reason: "no_legal_basis" });

    expect(
      assertCampaignRecipientAllowed({
        hasMarketingConsent: false,
        source: "account",
      }),
    ).toEqual({ ok: false, reason: "no_legal_basis" });

    expect(
      assertCampaignRecipientAllowed({
        hasMarketingConsent: true,
        source: "order_customer",
      }),
    ).toEqual({ ok: true });
  });
});

describe("notification retries", () => {
  it("backs off exponentially and caps attempts", () => {
    const first = nextRetryAt(1, new Date("2026-01-01T00:00:00.000Z"));
    expect(first.toISOString()).toBe("2026-01-01T00:02:00.000Z");
    expect(canRetryEvent({ attempts: 7 })).toBe(true);
    expect(canRetryEvent({ attempts: 8 })).toBe(false);
  });
});
