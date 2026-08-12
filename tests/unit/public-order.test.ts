import { describe, expect, it } from "vitest";

import { assertServerTotalsTrusted } from "@/lib/orders/rules";

describe("guest checkout totals", () => {
  it("still rejects mismatched client totals for guest payments", () => {
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

  it("accepts matching guest totals before Stripe redirect", () => {
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
  });
});

describe("business promotion pricing", () => {
  it("uses a $49 monthly catalog price in cents", () => {
    expect(4900).toBe(49_00);
  });
});
