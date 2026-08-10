import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createCartToken, hashCartToken } from "@/lib/commerce/cart-token-crypto";
import {
  assertCartCurrencyCompatible,
  buildPersonalizationSnapshot,
  calculateShippingCents,
  canAddQuantity,
  cartReviewLines,
  estimateTaxCents,
  isShippingQuoteFresh,
  planAnonymousCartLineMerge,
  postalCodeMatchesPatterns,
  productRequiresShipping,
} from "@/lib/commerce/rules";

describe("anonymous cart tokens", () => {
  it("issues opaque tokens and stores only a hash as the identity", () => {
    const token = createCartToken();
    expect(token).toHaveLength(64);
    expect(hashCartToken(token)).toBe(
      createHash("sha256").update(token).digest("hex"),
    );
    expect(hashCartToken(token)).not.toBe(token);
  });

  it("does not use localStorage — cookie hash identity is deterministic", () => {
    const token = "a".repeat(64);
    expect(hashCartToken(token)).toEqual(hashCartToken(token));
  });
});

describe("currency restrictions", () => {
  it("allows the first currency to set the cart", () => {
    expect(assertCartCurrencyCompatible(null, "CAD")).toEqual({
      ok: true,
      currency: "CAD",
    });
  });

  it("rejects mixing CAD and USD", () => {
    expect(assertCartCurrencyCompatible("CAD", "USD")).toEqual({
      ok: false,
      reason: "currency_mismatch",
    });
  });
});

describe("cart merging", () => {
  it("merges compatible anonymous lines into the user cart", () => {
    expect(
      planAnonymousCartLineMerge({
        userCartCurrency: "CAD",
        existingQuantity: 1,
        line: {
          productVariantId: "v1",
          awardEligibilityId: "e1",
          quantity: 1,
          currencyCode: "CAD",
          maxQuantity: 5,
          eligibilityActive: true,
          requiresAwardEligibility: true,
        },
      }),
    ).toEqual({ action: "merge", quantity: 2 });
  });

  it("skips currency-mismatched anonymous lines", () => {
    expect(
      planAnonymousCartLineMerge({
        userCartCurrency: "USD",
        existingQuantity: 0,
        line: {
          productVariantId: "v1",
          awardEligibilityId: "e1",
          quantity: 1,
          currencyCode: "CAD",
          maxQuantity: 5,
          eligibilityActive: true,
          requiresAwardEligibility: true,
        },
      }),
    ).toEqual({ action: "skip", reason: "currency_mismatch" });
  });

  it("skips revoked eligibility lines during merge", () => {
    expect(
      planAnonymousCartLineMerge({
        userCartCurrency: "CAD",
        existingQuantity: 0,
        line: {
          productVariantId: "v1",
          awardEligibilityId: "e1",
          quantity: 1,
          currencyCode: "CAD",
          maxQuantity: 5,
          eligibilityActive: false,
          requiresAwardEligibility: true,
        },
      }),
    ).toEqual({ action: "skip", reason: "eligibility_invalid" });
  });
});

describe("shipping", () => {
  it("calculates flat_plus_per_item with handling", () => {
    expect(
      calculateShippingCents({
        pricingMethod: "flat_plus_per_item",
        basePriceCents: 1200,
        pricePerItemCents: 400,
        handlingFeeCents: 300,
        shippableItemQuantity: 2,
      }),
    ).toBe(2300);
  });

  it("never charges shipping for digital products", () => {
    expect(productRequiresShipping("digital", true)).toBe(false);
    expect(
      cartReviewLines({
        subtotalCents: 3900,
        shippingCents: 9999,
        estimatedTaxCents: 0,
        requiresShipping: false,
      }).shippingCents,
    ).toBe(0);
  });

  it("shows shipping as a separate line in review totals", () => {
    expect(
      cartReviewLines({
        subtotalCents: 15900,
        shippingCents: 1500,
        estimatedTaxCents: 2262,
        requiresShipping: true,
      }),
    ).toEqual({
      subtotalCents: 15900,
      shippingCents: 1500,
      estimatedTaxCents: 2262,
      totalCents: 19662,
    });
  });

  it("matches CA and US postal patterns and expires quotes", () => {
    expect(postalCodeMatchesPatterns("K1A 0B1", ["^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$"])).toBe(
      true,
    );
    expect(postalCodeMatchesPatterns("10001", ["^\\d{5}(-\\d{4})?$"])).toBe(true);
    expect(isShippingQuoteFresh(new Date(Date.now() + 60_000).toISOString())).toBe(true);
    expect(isShippingQuoteFresh(new Date(Date.now() - 1000).toISOString())).toBe(false);
  });

  it("estimates CA tax on subtotal plus shipping", () => {
    expect(
      estimateTaxCents({ countryCode: "CA", subtotalCents: 10000, shippingCents: 1000 }),
    ).toBe(1430);
    expect(
      estimateTaxCents({ countryCode: "US", subtotalCents: 10000, shippingCents: 1000 }),
    ).toBe(0);
  });
});

describe("eligibility and personalization", () => {
  it("builds an immutable personalization snapshot from eligibility fields", () => {
    const snapshot = buildPersonalizationSnapshot({
      awardEligibilityId: "elig-1",
      businessName: "Harbor Cafe",
      communityName: "Kingston",
      categoryName: "Best Cafe",
      campaignYear: 2026,
      placement: "gold",
      frozenAt: "2026-03-25T12:00:00.000Z",
    });
    expect(snapshot).toEqual({
      awardEligibilityId: "elig-1",
      businessName: "Harbor Cafe",
      communityName: "Kingston",
      categoryName: "Best Cafe",
      campaignYear: 2026,
      placement: "gold",
      frozenAt: "2026-03-25T12:00:00.000Z",
    });
  });

  it("enforces configurable quantity limits", () => {
    expect(
      canAddQuantity({ maxQuantity: 3, existingQuantity: 2, addQuantity: 1 }),
    ).toBe(true);
    expect(
      canAddQuantity({ maxQuantity: 3, existingQuantity: 3, addQuantity: 1 }),
    ).toBe(false);
  });
});
