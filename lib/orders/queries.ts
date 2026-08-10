import "server-only";

import { createHash } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { mapOrder, mapOrderItem, mapPayment, mapRefund, mapWebhookEvent } from "@/lib/orders/mappers";
import type { Order, OrderItem, OrderWithItems, PaymentRecord, RefundRecord } from "@/types/orders";

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return null;
  }
  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at");
  return { ...mapOrder(order), items: (items ?? []).map(mapOrderItem) };
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) {
    return null;
  }
  return getOrderById(order.id);
}

export async function getOrderByCheckoutSessionId(
  sessionId: string,
): Promise<OrderWithItems | null> {
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (!order) {
    return null;
  }
  return getOrderById(order.id);
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapOrder);
}

export async function listOrdersForAdmin(input?: {
  paymentStatus?: string;
  limit?: number;
}): Promise<Order[]> {
  const admin = createSupabaseAdminClient();
  let query = admin.from("orders").select("*").order("created_at", { ascending: false });
  if (input?.paymentStatus) {
    query = query.eq(
      "payment_status",
      input.paymentStatus as
        | "unpaid"
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded",
    );
  }
  if (input?.limit) {
    query = query.limit(input.limit);
  }
  const { data } = await query;
  return (data ?? []).map(mapOrder);
}

export async function listPaymentsForOrder(orderId: string): Promise<PaymentRecord[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapPayment);
}

export async function listRefundsForOrder(orderId: string): Promise<RefundRecord[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("refunds")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapRefund);
}

export async function listOrderItems(orderId: string): Promise<OrderItem[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at");
  return (data ?? []).map(mapOrderItem);
}

export function hashWebhookPayload(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

export async function findWebhookEvent(providerEventId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("webhook_events")
    .select("*")
    .eq("provider", "stripe")
    .eq("provider_event_id", providerEventId)
    .maybeSingle();
  return data ? mapWebhookEvent(data) : null;
}

export function ordersToCsv(orders: Order[]): string {
  const header = [
    "order_number",
    "customer_email",
    "currency_code",
    "status",
    "payment_status",
    "fulfillment_status",
    "subtotal_cents",
    "shipping_cents",
    "tax_cents",
    "discount_cents",
    "total_cents",
    "fraud_flags",
    "placed_at",
    "created_at",
  ];
  const rows = orders.map((order) =>
    [
      order.orderNumber,
      order.customerEmail,
      order.currencyCode,
      order.status,
      order.paymentStatus,
      order.fulfillmentStatus,
      String(order.subtotalCents),
      String(order.shippingCents),
      String(order.taxCents),
      String(order.discountCents),
      String(order.totalCents),
      order.fraudFlags.join("|"),
      order.placedAt ?? "",
      order.createdAt,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}
