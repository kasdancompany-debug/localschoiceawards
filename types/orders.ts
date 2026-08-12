import type { CommerceCurrency } from "@/types/commerce";

export const ORDER_STATUSES = [
  "pending",
  "awaiting_payment",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const FULFILLMENT_STATUSES = [
  "not_started",
  "queued",
  "in_progress",
  "shipped",
  "cancelled",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const PAYMENT_RECORD_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "canceled",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number];

export const REFUND_STATUSES = ["pending", "succeeded", "failed", "canceled"] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const WEBHOOK_PROCESSING_STATUSES = [
  "received",
  "processing",
  "processed",
  "ignored",
  "failed",
] as const;
export type WebhookProcessingStatus = (typeof WEBHOOK_PROCESSING_STATUSES)[number];

export type Order = {
  id: string;
  orderNumber: string;
  userId: string | null;
  businessId: string | null;
  cartId: string | null;
  currencyCode: CommerceCurrency;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  shippingMethodSnapshot: Record<string, unknown>;
  shippingAddressSnapshot: Record<string, unknown>;
  billingAddressSnapshot: Record<string, unknown>;
  customerEmail: string;
  stripeCustomerId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  fraudFlags: string[];
  fraudNotes: string;
  placedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productVariantId: string;
  awardEligibilityId: string | null;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  personalizationSnapshot: Record<string, unknown>;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  orderId: string;
  provider: "stripe";
  providerPaymentId: string;
  amountCents: number;
  currencyCode: CommerceCurrency;
  status: PaymentRecordStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type RefundRecord = {
  id: string;
  orderId: string;
  paymentId: string;
  providerRefundId: string | null;
  amountCents: number;
  reason: string;
  status: RefundStatus;
  requestedBy: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type WebhookEventRecord = {
  id: string;
  provider: "stripe";
  providerEventId: string;
  eventType: string;
  payloadHash: string;
  processingStatus: WebhookProcessingStatus;
  attempts: number;
  errorMessage: string | null;
  receivedAt: string;
  lastAttemptAt: string | null;
  processedAt: string | null;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};
