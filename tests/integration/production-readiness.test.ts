import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { CLIENT_TRACKABLE_ANALYTICS_EVENTS, ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { assertBusinessMediaPathOwned } from "@/lib/businesses/media-rules";
import {
  assertServerTotalsTrusted,
  assertUnitPricesUnaltered,
  classifyWebhookDuplicate,
} from "@/lib/orders/rules";
import { evaluateRateLimitWindow } from "@/lib/security/rate-limit-policy";
import { safeRedirectPathSchema } from "@/lib/validation/auth";
import {
  buildTestOrder,
  buildTestWebhookEvent,
  resetFactorySequence,
} from "@/tests/factories";
import {
  assertSafeTestCleanupTarget,
  cleanupFactoryArtifacts,
  isSafeTestEmail,
} from "@/tests/helpers/cleanup";

afterEach(() => {
  resetFactorySequence();
});

describe("integration: checkout integrity", () => {
  it("rejects client total and unit-price tampering", () => {
    const order = buildTestOrder({ totalCents: 17400 });
    expect(
      assertServerTotalsTrusted({
        clientTotalCents: order.totalCents + 500,
        server: {
          subtotalCents: 15900,
          shippingCents: 1500,
          taxCents: 0,
          discountCents: 0,
        },
      }).ok,
    ).toBe(false);

    expect(
      assertUnitPricesUnaltered({
        lines: [
          {
            cartUnitPriceCents: 100,
            catalogUnitPriceCents: 15900,
            productName: "Plaque",
          },
        ],
      }).ok,
    ).toBe(false);
  });
});

describe("integration: webhook reclaim", () => {
  it("reclaims stuck processing events using factory fixtures", () => {
    const fresh = buildTestWebhookEvent({
      processingStatus: "processing",
      lastAttemptAt: new Date().toISOString(),
    });
    expect(
      classifyWebhookDuplicate({
        existingStatus: fresh.processingStatus,
        lastAttemptAt: fresh.lastAttemptAt,
        receivedAt: fresh.receivedAt,
      }),
    ).toBe("duplicate_skip");

    const stuck = buildTestWebhookEvent({
      processingStatus: "processing",
      lastAttemptAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    });
    expect(
      classifyWebhookDuplicate({
        existingStatus: stuck.processingStatus,
        lastAttemptAt: stuck.lastAttemptAt,
        receivedAt: stuck.receivedAt,
      }),
    ).toBe("process");
  });
});

describe("integration: analytics allowlist", () => {
  it("keeps server-only commerce/email events off the public allowlist", () => {
    expect(CLIENT_TRACKABLE_ANALYTICS_EVENTS).not.toContain(ANALYTICS_EVENTS.funnelOrderPaid);
    expect(CLIENT_TRACKABLE_ANALYTICS_EVENTS).not.toContain(ANALYTICS_EVENTS.emailDelivered);
    expect(CLIENT_TRACKABLE_ANALYTICS_EVENTS).toContain(ANALYTICS_EVENTS.businessProfileView);
  });
});

describe("integration: media path binding", () => {
  it("binds storage paths to business id", () => {
    const businessId = "11111111-1111-4111-8111-111111111111";
    expect(() =>
      assertBusinessMediaPathOwned(businessId, `${businessId}/photo.webp`),
    ).not.toThrow();
    expect(() =>
      assertBusinessMediaPathOwned(businessId, "other-business/photo.webp"),
    ).toThrow(/Invalid media storage path/);
    expect(() =>
      assertBusinessMediaPathOwned(businessId, `${businessId}/../escape.webp`),
    ).toThrow();
  });
});

describe("integration: rate limits & redirects", () => {
  it("rate-limits analytics track bursts", () => {
    expect(evaluateRateLimitWindow(119, "analytics_track").allowed).toBe(true);
    expect(evaluateRateLimitWindow(120, "analytics_track").allowed).toBe(false);
  });

  it("blocks open redirects", () => {
    expect(safeRedirectPathSchema.safeParse("/account").success).toBe(true);
    expect(safeRedirectPathSchema.safeParse("//evil.example").success).toBe(false);
    expect(safeRedirectPathSchema.safeParse("https://evil.example").success).toBe(false);
  });
});

describe("integration: unsubscribe HMAC shape", () => {
  it("signs with hmac payload.sig format", () => {
    const secret = "test-unsubscribe-secret";
    const payload = Buffer.from(JSON.stringify({ userId: "u1", v: 1 }), "utf8").toString(
      "base64url",
    );
    const sig = createHmac("sha256", secret).update(payload).digest("base64url");
    expect(`${payload}.${sig}`.split(".")).toHaveLength(2);
  });
});

describe("integration: safe cleanup guards", () => {
  it("only cleans factory emails and ids", () => {
    expect(isSafeTestEmail("a@example.test")).toBe(true);
    expect(isSafeTestEmail("real@gmail.com")).toBe(false);
    expect(() =>
      assertSafeTestCleanupTarget({ emails: ["real@gmail.com"] }),
    ).toThrow(/Refusing/);
    expect(() =>
      assertSafeTestCleanupTarget({ ids: ["11111111-1111-4111-8111-111111111111"] }),
    ).toThrow(/Refusing/);
  });

  it("no-ops cleanup without admin client", async () => {
    const result = await cleanupFactoryArtifacts({ admin: null });
    expect(result.cleaned).toBe(false);
  });
});
