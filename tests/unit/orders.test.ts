import { describe, expect, it } from "vitest";

import {
  assertServerTotalsTrusted,
  assertShippingQuoteUsable,
  assertUnitPricesUnaltered,
  buildStripeCheckoutLineItems,
  canMarkOrderPaidFromSource,
  classifyWebhookDuplicate,
  computeOrderTotalCents,
  fulfillmentStatusAfterPayment,
  orderStatusAfterPayment,
  shouldRestoreEligibilityAfterRefund,
  successPagePaymentMessage,
} from "@/lib/orders/rules";

describe("checkout price integrity", () => {
  it("rejects client totals that do not match server recomputation", () => {
    expect(
      assertServerTotalsTrusted({
        clientTotalCents: 100,
        server: {
          subtotalCents: 15900,
          shippingCents: 1500,
          taxCents: 0,
          discountCents: 0,
        },
      }),
    ).toEqual({ ok: false, reason: "client_total_mismatch" });
  });

  it("accepts matching totals and detects altered catalog prices", () => {
    expect(
      assertServerTotalsTrusted({
        clientTotalCents: 17400,
        server: {
          subtotalCents: 15900,
          shippingCents: 1500,
          taxCents: 0,
          discountCents: 0,
        },
      }),
    ).toEqual({ ok: true, totalCents: 17400 });

    expect(
      assertUnitPricesUnaltered({
        lines: [
          {
            cartUnitPriceCents: 15900,
            catalogUnitPriceCents: 14900,
            productName: "Premium Glass Award",
          },
        ],
      }),
    ).toEqual({
      ok: false,
      reason: "price_altered",
      productName: "Premium Glass Award",
    });
  });
});

describe("expired shipping quotes", () => {
  it("blocks checkout when a shipping quote has expired", () => {
    expect(
      assertShippingQuoteUsable({
        requiresShipping: true,
        quoteExpiresAt: new Date(Date.now() - 1000).toISOString(),
        quoteShippingCents: 1500,
      }),
    ).toEqual({ ok: false, reason: "quote_expired" });
  });

  it("allows digital carts without shipping quotes", () => {
    expect(
      assertShippingQuoteUsable({
        requiresShipping: false,
        quoteExpiresAt: null,
        quoteShippingCents: null,
      }),
    ).toEqual({ ok: true, shippingCents: 0 });
  });
});

describe("stripe line items", () => {
  it("keeps merchandise and shipping as separate line items", () => {
    const items = buildStripeCheckoutLineItems({
      currencyCode: "CAD",
      merchandise: [
        { name: "Premium Glass Award", unitPriceCents: 15900, quantity: 1 },
      ],
      shippingCents: 1900,
      shippingLabel: "Canada Standard",
    });
    expect(items).toHaveLength(2);
    expect(items[0]?.price_data.product_data.name).toBe("Premium Glass Award");
    expect(items[1]?.price_data.product_data.name).toBe("Shipping");
    expect(items[1]?.price_data.unit_amount).toBe(1900);
  });
});

describe("webhook payment confirmation", () => {
  it("never marks paid from the success page", () => {
    expect(canMarkOrderPaidFromSource("success_page")).toBe(false);
    expect(canMarkOrderPaidFromSource("verified_webhook")).toBe(true);
  });

  it("queues fulfillment only after paid status", () => {
    expect(fulfillmentStatusAfterPayment("paid")).toBe("queued");
    expect(fulfillmentStatusAfterPayment("failed")).toBeNull();
    expect(orderStatusAfterPayment("failed")).toBe("awaiting_payment");
  });

  it("skips duplicate processed webhook events", () => {
    expect(classifyWebhookDuplicate({ existingStatus: null })).toBe("process");
    expect(classifyWebhookDuplicate({ existingStatus: "processed" })).toBe("duplicate_skip");
    expect(classifyWebhookDuplicate({ existingStatus: "ignored" })).toBe("duplicate_skip");
    expect(classifyWebhookDuplicate({ existingStatus: "failed" })).toBe("process");
  });

  it("explains pending confirmation on the success page", () => {
    expect(successPagePaymentMessage("pending")).toContain("may take a moment");
    expect(successPagePaymentMessage("paid")).toContain("Payment confirmed");
    expect(successPagePaymentMessage("failed")).toContain("Payment failed");
  });
});

describe("failed payments and refunds", () => {
  it("computes totals with separate shipping and tax", () => {
    expect(
      computeOrderTotalCents({
        subtotalCents: 15900,
        shippingCents: 1500,
        taxCents: 2262,
        discountCents: 0,
      }),
    ).toBe(19662);
  });

  it("does not restore award eligibility after refund", () => {
    expect(shouldRestoreEligibilityAfterRefund()).toBe(false);
  });
});
