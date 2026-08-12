import "server-only";

import type Stripe from "stripe";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { toJson } from "@/lib/orders/mappers";
import {
  classifyWebhookDuplicate,
  fulfillmentStatusAfterPayment,
  orderStatusAfterPayment,
  orderStatusAfterRefund,
  paymentStatusAfterRefund,
} from "@/lib/orders/rules";
import { findWebhookEvent, hashWebhookPayload } from "@/lib/orders/queries";
import type { CommerceCurrency } from "@/types/commerce";

function addressSnapshotFromStripe(
  address: Stripe.Address | null | undefined,
  name?: string | null,
): Record<string, unknown> {
  if (!address) {
    return {};
  }
  return {
    name: name ?? null,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
  };
}

async function beginWebhookProcessing(input: {
  event: Stripe.Event;
  payload: string;
}): Promise<{ proceed: boolean; webhookEventId: string | null }> {
  const admin = createSupabaseAdminClient();
  const existing = await findWebhookEvent(input.event.id);
  const classification = classifyWebhookDuplicate({
    existingStatus: existing?.processingStatus ?? null,
    lastAttemptAt: existing?.lastAttemptAt ?? null,
    receivedAt: existing?.receivedAt ?? null,
  });

  if (classification === "duplicate_skip" && existing) {
    return { proceed: false, webhookEventId: existing.id };
  }

  const nowIso = new Date().toISOString();

  if (existing) {
    await admin
      .from("webhook_events")
      .update({
        processing_status: "processing",
        attempts: existing.attempts + 1,
        error_message: null,
        last_attempt_at: nowIso,
      })
      .eq("id", existing.id);
    return { proceed: true, webhookEventId: existing.id };
  }

  const { data, error } = await admin
    .from("webhook_events")
    .insert({
      provider: "stripe",
      provider_event_id: input.event.id,
      event_type: input.event.type,
      payload_hash: hashWebhookPayload(input.payload),
      processing_status: "processing",
      attempts: 1,
      last_attempt_at: nowIso,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // Unique conflict — another worker inserted first.
    const raced = await findWebhookEvent(input.event.id);
    if (
      raced &&
      classifyWebhookDuplicate({
        existingStatus: raced.processingStatus,
        lastAttemptAt: raced.lastAttemptAt,
        receivedAt: raced.receivedAt,
      }) === "duplicate_skip"
    ) {
      return { proceed: false, webhookEventId: raced.id };
    }
    return { proceed: false, webhookEventId: null };
  }

  return { proceed: true, webhookEventId: data?.id ?? null };
}

async function finishWebhookProcessing(input: {
  webhookEventId: string | null;
  status: "processed" | "ignored" | "failed";
  errorMessage?: string;
}) {
  if (!input.webhookEventId) {
    return;
  }
  const admin = createSupabaseAdminClient();
  await admin
    .from("webhook_events")
    .update({
      processing_status: input.status,
      error_message: input.errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", input.webhookEventId);
}

async function markOrderPaidFromSession(session: Stripe.Checkout.Session) {
  const admin = createSupabaseAdminClient();
  const orderId =
    session.metadata?.order_id ??
    (typeof session.client_reference_id === "string" ? session.client_reference_id : null);

  if (!orderId) {
    return { ok: false as const, message: "Missing order metadata on Checkout Session." };
  }

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    return { ok: false as const, message: "Order not found for Checkout Session." };
  }

  if (order.payment_status === "paid") {
    return { ok: true as const, duplicate: true };
  }

  const currency = (session.currency ?? order.currency_code).toUpperCase() as CommerceCurrency;
  const amountTotal = session.amount_total ?? order.total_cents;
  const amountSubtotal = session.amount_subtotal ?? order.subtotal_cents + order.shipping_cents;
  const taxCents = Math.max(0, amountTotal - amountSubtotal);
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const sessionAny = session as Stripe.Checkout.Session & {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
    collected_information?: {
      shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
    } | null;
  };
  const shippingDetails =
    sessionAny.collected_information?.shipping_details ?? sessionAny.shipping_details ?? null;
  const customerDetails = session.customer_details;

  const fulfillment = fulfillmentStatusAfterPayment("paid");
  const status = orderStatusAfterPayment("paid");

  await admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: status ?? "paid",
      fulfillment_status: fulfillment ?? "queued",
      tax_cents: taxCents,
      total_cents: order.subtotal_cents + order.shipping_cents + taxCents - order.discount_cents,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : order.stripe_customer_id,
      customer_email: customerDetails?.email ?? order.customer_email,
      shipping_address_snapshot: toJson(
        addressSnapshotFromStripe(shippingDetails?.address, shippingDetails?.name),
      ),
      billing_address_snapshot: toJson(
        addressSnapshotFromStripe(customerDetails?.address, customerDetails?.name),
      ),
      placed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (paymentIntentId) {
    await admin.from("payments").upsert(
      {
        order_id: orderId,
        provider: "stripe",
        provider_payment_id: paymentIntentId,
        amount_cents: amountTotal,
        currency_code: currency,
        status: "succeeded",
        metadata: toJson({
          checkout_session_id: session.id,
          payment_status: session.payment_status,
        }),
      },
      { onConflict: "provider,provider_payment_id" },
    );
  }

  if (order.cart_id) {
    await admin.from("carts").update({ status: "converted" }).eq("id", order.cart_id);
  }

  const customerEmail = customerDetails?.email ?? order.customer_email;
  if (customerEmail) {
    const { softEmitNotificationEvent } = await import("@/lib/notifications/emit");
    const { cancelWinnerSalesSequenceForUser } = await import("@/lib/notifications/winner-sales");
    const { softTrackAnalyticsEvent } = await import("@/lib/analytics/track");
    const { ANALYTICS_EVENTS } = await import("@/lib/analytics/events");
    await softEmitNotificationEvent({
      eventType: "commerce.payment_confirmed",
      aggregateType: "order",
      aggregateId: orderId,
      templateKey: "commerce.payment_confirmed",
      recipientEmail: customerEmail,
      userId: order.user_id,
      recipientSource: "order_customer",
      subjectVars: { orderNumber: order.order_number },
      templateVars: { orderNumber: order.order_number },
    });
    await softEmitNotificationEvent({
      eventType: "commerce.order_received",
      aggregateType: "order",
      aggregateId: orderId,
      templateKey: "commerce.order_received",
      recipientEmail: customerEmail,
      userId: order.user_id,
      recipientSource: "order_customer",
      sequenceKey: "order-received",
      subjectVars: { orderNumber: order.order_number },
      templateVars: { orderNumber: order.order_number },
    });
    if (order.user_id) {
      await cancelWinnerSalesSequenceForUser({ userId: order.user_id });
    }
    await softTrackAnalyticsEvent({
      eventName: ANALYTICS_EVENTS.funnelOrderPaid,
      userId: order.user_id,
      businessId: order.business_id,
      properties: {
        order_id: orderId,
        order_number: order.order_number,
        total_cents: order.total_cents,
      },
    });
    await softTrackAnalyticsEvent({
      eventName: ANALYTICS_EVENTS.winnerProductPurchase,
      userId: order.user_id,
      businessId: order.business_id,
      properties: {
        order_id: orderId,
      },
    });
  }

  // First successful payment confirmation only (duplicates return earlier).
  const { createFulfillmentsForPaidOrder } = await import("@/lib/fulfillment/service");
  await createFulfillmentsForPaidOrder({ orderId });

  return { ok: true as const, duplicate: false };
}

async function markPaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const admin = createSupabaseAdminClient();
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) {
    return;
  }

  await admin
    .from("orders")
    .update({
      payment_status: "failed",
      status: "awaiting_payment",
      fulfillment_status: "not_started",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("id", orderId)
    .neq("payment_status", "paid");

  await admin.from("payments").upsert(
    {
      order_id: orderId,
      provider: "stripe",
      provider_payment_id: paymentIntent.id,
      amount_cents: paymentIntent.amount,
      currency_code: paymentIntent.currency.toUpperCase() as CommerceCurrency,
      status: "failed",
      metadata: toJson({
        last_payment_error: paymentIntent.last_payment_error?.message ?? null,
      }),
    },
    { onConflict: "provider,provider_payment_id" },
  );
}

async function applyStripeRefund(refund: Stripe.Refund) {
  const admin = createSupabaseAdminClient();
  const paymentIntentId =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : refund.payment_intent?.id;
  if (!paymentIntentId) {
    return;
  }

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("provider", "stripe")
    .eq("provider_payment_id", paymentIntentId)
    .maybeSingle();
  if (!payment) {
    return;
  }

  const { data: existingRefund } = await admin
    .from("refunds")
    .select("*")
    .eq("provider_refund_id", refund.id)
    .maybeSingle();

  if (existingRefund) {
    await admin
      .from("refunds")
      .update({
        status: refund.status === "succeeded" ? "succeeded" : refund.status === "failed" ? "failed" : "pending",
        completed_at: refund.status === "succeeded" ? new Date().toISOString() : null,
      })
      .eq("id", existingRefund.id);
  } else {
    await admin.from("refunds").insert({
      order_id: payment.order_id,
      payment_id: payment.id,
      provider_refund_id: refund.id,
      amount_cents: refund.amount,
      reason: refund.reason ?? "",
      status: refund.status === "succeeded" ? "succeeded" : "pending",
      completed_at: refund.status === "succeeded" ? new Date().toISOString() : null,
    });
  }

  const { data: refunds } = await admin
    .from("refunds")
    .select("amount_cents, status")
    .eq("order_id", payment.order_id)
    .eq("status", "succeeded");
  const refundedCents = (refunds ?? []).reduce((sum, row) => sum + row.amount_cents, 0);
  const paymentStatus = paymentStatusAfterRefund({
    refundedCents,
    paidCents: payment.amount_cents,
  });
  const orderStatus = orderStatusAfterRefund({
    refundedCents,
    paidCents: payment.amount_cents,
  });

  await admin
    .from("orders")
    .update({
      payment_status: paymentStatus,
      status: orderStatus,
    })
    .eq("id", payment.order_id);

  await admin
    .from("payments")
    .update({
      status:
        paymentStatus === "refunded"
          ? "refunded"
          : paymentStatus === "partially_refunded"
            ? "partially_refunded"
            : payment.status,
    })
    .eq("id", payment.id);

  // Intentionally do not restore award eligibility after refund.
}

export async function processStripeWebhookEvent(input: {
  event: Stripe.Event;
  payload: string;
}): Promise<{ ok: boolean; duplicate?: boolean; message?: string }> {
  const gate = await beginWebhookProcessing(input);
  if (!gate.proceed) {
    return { ok: true, duplicate: true };
  }

  try {
    switch (input.event.type) {
      case "checkout.session.completed": {
        const session = input.event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" || session.metadata?.kind === "business_promotion") {
          const { activatePromotionFromCheckoutSession } = await import(
            "@/lib/promotions/service"
          );
          const result = await activatePromotionFromCheckoutSession(session);
          if (!result.ok) {
            await finishWebhookProcessing({
              webhookEventId: gate.webhookEventId,
              status: "failed",
              errorMessage: result.message,
            });
            return { ok: false, message: result.message };
          }
          break;
        }
        if (session.payment_status === "paid" || session.status === "complete") {
          const result = await markOrderPaidFromSession(session);
          if (!result.ok) {
            await finishWebhookProcessing({
              webhookEventId: gate.webhookEventId,
              status: "failed",
              errorMessage: result.message,
            });
            return { ok: false, message: result.message };
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = input.event.data.object as Stripe.Subscription;
        const { syncPromotionFromSubscription } = await import("@/lib/promotions/service");
        await syncPromotionFromSubscription(subscription);
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = input.event.data.object as Stripe.Checkout.Session;
        const result = await markOrderPaidFromSession(session);
        if (!result.ok) {
          await finishWebhookProcessing({
            webhookEventId: gate.webhookEventId,
            status: "failed",
            errorMessage: result.message,
          });
          return { ok: false, message: result.message };
        }
        break;
      }
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed": {
        const object = input.event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session;
        if ("object" in object && object.object === "payment_intent") {
          await markPaymentFailed(object as Stripe.PaymentIntent);
        } else if ("payment_intent" in object) {
          const session = object as Stripe.Checkout.Session;
          const pi =
            typeof session.payment_intent === "string"
              ? null
              : session.payment_intent;
          if (pi) {
            await markPaymentFailed(pi);
          } else if (session.metadata?.order_id) {
            const admin = createSupabaseAdminClient();
            await admin
              .from("orders")
              .update({ payment_status: "failed", status: "awaiting_payment" })
              .eq("id", session.metadata.order_id)
              .neq("payment_status", "paid");
          }
        }
        break;
      }
      case "charge.refunded":
      case "refund.created":
      case "refund.updated": {
        const refund =
          input.event.type === "charge.refunded"
            ? ((input.event.data.object as Stripe.Charge).refunds?.data[0] as
                | Stripe.Refund
                | undefined)
            : (input.event.data.object as Stripe.Refund);
        if (refund) {
          await applyStripeRefund(refund);
        }
        break;
      }
      default:
        await finishWebhookProcessing({
          webhookEventId: gate.webhookEventId,
          status: "ignored",
        });
        return { ok: true };
    }

    await finishWebhookProcessing({
      webhookEventId: gate.webhookEventId,
      status: "processed",
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    await finishWebhookProcessing({
      webhookEventId: gate.webhookEventId,
      status: "failed",
      errorMessage: message,
    });
    return { ok: false, message };
  }
}
