import { describe, expect, it } from "vitest";

import {
  assertOrderPaidForFulfillment,
  buildSubmissionIdempotencyKey,
  buildSupplierCustomerSnapshot,
  calculateGrossMargin,
  canAccessSupplierFulfillment,
  canSubmitFulfillment,
  destinationCountryFromAddress,
  selectSupplierForOrder,
  type SupplierRouteCandidate,
} from "@/lib/fulfillment/rules";

const baseCandidate = (overrides: Partial<SupplierRouteCandidate>): SupplierRouteCandidate => ({
  supplierId: "s1",
  supplierName: "Alpha",
  countryCode: "CA",
  currencyCode: "CAD",
  active: true,
  fulfillmentMethod: "portal",
  manufacturingCostCents: 5000,
  setupCostCents: 200,
  supplierShippingCostCents: 900,
  coversAllVariants: true,
  ...overrides,
});

describe("supplier routing", () => {
  it("routes Canadian destinations to Canadian suppliers when available", () => {
    const selected = selectSupplierForOrder({
      destinationCountry: "CA",
      candidates: [
        baseCandidate({
          supplierId: "us",
          supplierName: "US Co",
          countryCode: "US",
          currencyCode: "USD",
          manufacturingCostCents: 1000,
        }),
        baseCandidate({
          supplierId: "ca",
          supplierName: "CA Co",
          countryCode: "CA",
          manufacturingCostCents: 4000,
        }),
      ],
    });
    expect(selected?.supplierId).toBe("ca");
  });

  it("prefers lower total cost among destination-matched suppliers", () => {
    const selected = selectSupplierForOrder({
      destinationCountry: "US",
      candidates: [
        baseCandidate({
          supplierId: "a",
          supplierName: "A",
          countryCode: "US",
          currencyCode: "USD",
          manufacturingCostCents: 8000,
          supplierShippingCostCents: 500,
        }),
        baseCandidate({
          supplierId: "b",
          supplierName: "B",
          countryCode: "US",
          currencyCode: "USD",
          manufacturingCostCents: 6000,
          supplierShippingCostCents: 500,
        }),
      ],
    });
    expect(selected?.supplierId).toBe("b");
  });

  it("ignores inactive or incomplete coverage", () => {
    expect(
      selectSupplierForOrder({
        destinationCountry: "CA",
        candidates: [
          baseCandidate({ active: false }),
          baseCandidate({ supplierId: "partial", coversAllVariants: false }),
        ],
      }),
    ).toBeNull();
  });
});

describe("duplicate submission", () => {
  it("blocks duplicate production orders", () => {
    expect(canSubmitFulfillment({ existingStatuses: ["submitted"] })).toEqual({
      ok: false,
      reason: "duplicate_production_order",
    });
    expect(canSubmitFulfillment({ existingStatuses: ["cancelled"] })).toEqual({ ok: true });
  });

  it("builds stable idempotency keys", () => {
    expect(
      buildSubmissionIdempotencyKey({ orderId: "o1", supplierId: "s1" }),
    ).toBe("fulfill:o1:s1:primary");
    expect(
      buildSubmissionIdempotencyKey({
        orderId: "o1",
        supplierId: "s1",
        parentFulfillmentId: "f1",
      }),
    ).toBe("fulfill:o1:s1:f1");
  });
});

describe("unauthorized access and payment gates", () => {
  it("denies suppliers that do not own the fulfillment", () => {
    expect(
      canAccessSupplierFulfillment({
        actorSupplierIds: ["s1"],
        fulfillmentSupplierId: "s2",
        isPlatformAdmin: false,
      }),
    ).toBe(false);
    expect(
      canAccessSupplierFulfillment({
        actorSupplierIds: [],
        fulfillmentSupplierId: "s2",
        isPlatformAdmin: true,
      }),
    ).toBe(true);
  });

  it("does not submit unpaid orders", () => {
    expect(assertOrderPaidForFulfillment("pending")).toBe(false);
    expect(assertOrderPaidForFulfillment("paid")).toBe(true);
  });
});

describe("privacy and margin", () => {
  it("limits supplier customer snapshot fields", () => {
    expect(
      buildSupplierCustomerSnapshot({
        shippingAddress: {
          name: "Ada",
          line1: "1 Main",
          city: "Kingston",
          state: "ON",
          postalCode: "K7L1A1",
          country: "CA",
        },
        customerEmail: "ada@example.com",
      }),
    ).toEqual({
      recipientName: "Ada",
      line1: "1 Main",
      line2: null,
      city: "Kingston",
      region: "ON",
      postalCode: "K7L1A1",
      country: "CA",
      email: "ada@example.com",
    });
  });

  it("reads destination country and calculates gross margin", () => {
    expect(destinationCountryFromAddress({ country: "us" })).toBe("US");
    const margin = calculateGrossMargin({
      customerMerchandiseCents: 15900,
      customerShippingCents: 1500,
      manufacturingCostCents: 7200,
      supplierShippingCostCents: 900,
    });
    expect(margin.customerRevenueCents).toBe(17400);
    expect(margin.supplierCostCents).toBe(8100);
    expect(margin.grossMarginCents).toBe(9300);
    expect(margin.grossMarginPercent).toBeCloseTo(53.45, 1);
  });
});
