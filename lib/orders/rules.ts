import type { CommerceCurrency } from "@/types/commerce";
import type {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  WebhookProcessingStatus,
} from "@/types/orders";

export type CheckoutTotalsInput = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
};

export function computeOrderTotalCents(input: CheckoutTotalsInput): number {
  return input.subtotalCents + input.shippingCents + input.taxCents - input.discountCents;
}

/**
 * Browser-supplied totals are never authoritative. Server recomputes and compares.
 */
export function assertServerTotalsTrusted(input: {
  clientTotalCents?: number | null;
  server: CheckoutTotalsInput;
}): { ok: true; totalCents: number } | { ok: false; reason: "client_total_mismatch" } {
  const totalCents = computeOrderTotalCents(input.server);
  if (
    typeof input.clientTotalCents === "number" &&
    input.clientTotalCents !== totalCents
  ) {
    return { ok: false, reason: "client_total_mismatch" };
  }
  return { ok: true, totalCents };
}

export function assertShippingQuoteUsable(input: {
  requiresShipping: boolean;
  quoteExpiresAt: string | null;
  quoteShippingCents: number | null;
  now?: Date;
}): { ok: true; shippingCents: number } | { ok: false; reason: "shipping_required" | "quote_expired" } {
  if (!input.requiresShipping) {
    return { ok: true, shippingCents: 0 };
  }
  if (input.quoteExpiresAt == null || input.quoteShippingCents == null) {
    return { ok: false, reason: "shipping_required" };
  }
  const now = input.now ?? new Date();
  if (new Date(input.quoteExpiresAt).getTime() <= now.getTime()) {
    return { ok: false, reason: "quote_expired" };
  }
  return { ok: true, shippingCents: input.quoteShippingCents };
}

export function assertUnitPricesUnaltered(input: {
  lines: Array<{ cartUnitPriceCents: number; catalogUnitPriceCents: number; productName: string }>;
}): { ok: true } | { ok: false; reason: "price_altered"; productName: string } {
  for (const line of input.lines) {
    if (line.cartUnitPriceCents !== line.catalogUnitPriceCents) {
      return { ok: false, reason: "price_altered", productName: line.productName };
    }
  }
  return { ok: true };
}

export function buildStripeCheckoutLineItems(input: {
  currencyCode: CommerceCurrency;
  merchandise: Array<{
    name: string;
    description?: string;
    unitPriceCents: number;
    quantity: number;
  }>;
  shippingCents: number;
  shippingLabel: string;
}): Array<{
  quantity: number;
  price_data: {
    currency: string;
    unit_amount: number;
    tax_behavior: "exclusive";
    product_data: { name: string; description?: string };
  };
}> {
  const currency = input.currencyCode.toLowerCase();
  const items = input.merchandise.map((line) => ({
    quantity: line.quantity,
    price_data: {
      currency,
      unit_amount: line.unitPriceCents,
      tax_behavior: "exclusive" as const,
      product_data: {
        name: line.name,
        ...(line.description ? { description: line.description } : {}),
      },
    },
  }));

  if (input.shippingCents > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: input.shippingCents,
        tax_behavior: "exclusive",
        product_data: {
          name: "Shipping",
          description: input.shippingLabel,
        },
      },
    });
  }

  return items;
}

export function canMarkOrderPaidFromSource(source: "success_page" | "verified_webhook"): boolean {
  return source === "verified_webhook";
}

export function fulfillmentStatusAfterPayment(
  paymentStatus: PaymentStatus,
): FulfillmentStatus | null {
  if (paymentStatus === "paid") {
    return "queued";
  }
  return null;
}

export function orderStatusAfterPayment(paymentStatus: PaymentStatus): OrderStatus | null {
  if (paymentStatus === "paid") {
    return "paid";
  }
  if (paymentStatus === "failed") {
    return "awaiting_payment";
  }
  return null;
}

export function orderStatusAfterRefund(input: {
  refundedCents: number;
  paidCents: number;
}): OrderStatus {
  if (input.refundedCents <= 0) {
    return "paid";
  }
  if (input.refundedCents >= input.paidCents) {
    return "refunded";
  }
  return "partially_refunded";
}

export function paymentStatusAfterRefund(input: {
  refundedCents: number;
  paidCents: number;
}): PaymentStatus {
  if (input.refundedCents <= 0) {
    return "paid";
  }
  if (input.refundedCents >= input.paidCents) {
    return "refunded";
  }
  return "partially_refunded";
}

/** Refunds never restore revoked award eligibility. */
export function shouldRestoreEligibilityAfterRefund(): false {
  return false;
}

const DEFAULT_WEBHOOK_RECLAIM_MS = 5 * 60 * 1000;

/**
 * Idempotent webhook gate. In-flight `processing`/`received` events are skipped
 * unless stuck past the reclaim TTL (crash/restart recovery).
 */
export function classifyWebhookDuplicate(input: {
  existingStatus: WebhookProcessingStatus | null;
  lastAttemptAt?: string | null;
  receivedAt?: string | null;
  now?: Date;
  reclaimAfterMs?: number;
}): "process" | "duplicate_skip" {
  if (!input.existingStatus) {
    return "process";
  }
  if (input.existingStatus === "processed" || input.existingStatus === "ignored") {
    return "duplicate_skip";
  }
  if (input.existingStatus === "failed") {
    return "process";
  }

  const reclaimAfterMs = input.reclaimAfterMs ?? DEFAULT_WEBHOOK_RECLAIM_MS;
  const anchor = input.lastAttemptAt ?? input.receivedAt;
  if (anchor) {
    const age = (input.now ?? new Date()).getTime() - new Date(anchor).getTime();
    if (Number.isFinite(age) && age >= reclaimAfterMs) {
      return "process";
    }
  }

  // received / processing — treat as in-flight duplicate
  return "duplicate_skip";
}

export function successPagePaymentMessage(paymentStatus: PaymentStatus): string {
  switch (paymentStatus) {
    case "paid":
      return "Payment confirmed. Fulfillment will begin shortly.";
    case "failed":
      return "Payment failed. You can return to checkout and try again.";
    case "refunded":
    case "partially_refunded":
      return "This order has refund activity. Contact support if you have questions.";
    default:
      return "Payment confirmation may take a moment. This page shows the live order status from our servers — loading the success page does not mark an order paid.";
  }
}

export const ORDER_FRAUD_FLAG_OPTIONS = [
  "suspicious_address",
  "velocity",
  "chargeback_risk",
  "manual_review",
  "eligibility_mismatch",
] as const;
export type OrderFraudFlag = (typeof ORDER_FRAUD_FLAG_OPTIONS)[number];
