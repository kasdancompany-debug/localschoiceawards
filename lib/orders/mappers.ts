import type {
  FulfillmentStatus,
  Order,
  OrderItem,
  PaymentRecord,
  PaymentRecordStatus,
  PaymentStatus,
  OrderStatus,
  RefundRecord,
  RefundStatus,
  WebhookEventRecord,
  WebhookProcessingStatus,
} from "@/types/orders";
import type { CommerceCurrency } from "@/types/commerce";
import type { Database, Json } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type RefundRow = Database["public"]["Tables"]["refunds"]["Row"];
type WebhookRow = Database["public"]["Tables"]["webhook_events"]["Row"];

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    businessId: row.business_id,
    cartId: row.cart_id,
    currencyCode: row.currency_code as CommerceCurrency,
    status: row.status as OrderStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    fulfillmentStatus: row.fulfillment_status as FulfillmentStatus,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    shippingMethodSnapshot: (row.shipping_method_snapshot ?? {}) as Record<string, unknown>,
    shippingAddressSnapshot: (row.shipping_address_snapshot ?? {}) as Record<string, unknown>,
    billingAddressSnapshot: (row.billing_address_snapshot ?? {}) as Record<string, unknown>,
    customerEmail: row.customer_email,
    stripeCustomerId: row.stripe_customer_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    fraudFlags: row.fraud_flags ?? [],
    fraudNotes: row.fraud_notes ?? "",
    placedAt: row.placed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productVariantId: row.product_variant_id,
    awardEligibilityId: row.award_eligibility_id,
    productNameSnapshot: row.product_name_snapshot,
    variantNameSnapshot: row.variant_name_snapshot,
    skuSnapshot: row.sku_snapshot,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    personalizationSnapshot: (row.personalization_snapshot ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: "stripe",
    providerPaymentId: row.provider_payment_id,
    amountCents: row.amount_cents,
    currencyCode: row.currency_code as CommerceCurrency,
    status: row.status as PaymentRecordStatus,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRefund(row: RefundRow): RefundRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    paymentId: row.payment_id,
    providerRefundId: row.provider_refund_id,
    amountCents: row.amount_cents,
    reason: row.reason,
    status: row.status as RefundStatus,
    requestedBy: row.requested_by,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function mapWebhookEvent(row: WebhookRow): WebhookEventRecord {
  return {
    id: row.id,
    provider: "stripe",
    providerEventId: row.provider_event_id,
    eventType: row.event_type,
    payloadHash: row.payload_hash,
    processingStatus: row.processing_status as WebhookProcessingStatus,
    attempts: row.attempts,
    errorMessage: row.error_message,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
  };
}

export function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}
