import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import {
  orderStatusAfterRefund,
  paymentStatusAfterRefund,
  shouldRestoreEligibilityAfterRefund,
} from "@/lib/orders/rules";
import { getStripeClient } from "@/lib/payments/stripe";
import type { OrderFraudFlag } from "@/lib/orders/rules";

export async function createAdminRefund(input: {
  orderId: string;
  amountCents: number;
  reason: string;
  requestedBy: string;
}): Promise<{ ok: true; refundId: string } | { ok: false; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", input.orderId).maybeSingle();
  if (!order) {
    return { ok: false, message: "Order not found." };
  }
  if (order.payment_status !== "paid" && order.payment_status !== "partially_refunded") {
    return { ok: false, message: "Only paid orders can be refunded." };
  }
  if (!order.stripe_payment_intent_id) {
    return { ok: false, message: "Missing Stripe payment intent on order." };
  }

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", order.id)
    .eq("provider_payment_id", order.stripe_payment_intent_id)
    .maybeSingle();
  if (!payment) {
    return { ok: false, message: "Payment record not found." };
  }

  const { data: existingRefunds } = await admin
    .from("refunds")
    .select("amount_cents")
    .eq("order_id", order.id)
    .eq("status", "succeeded");
  const alreadyRefunded = (existingRefunds ?? []).reduce((sum, row) => sum + row.amount_cents, 0);
  if (input.amountCents <= 0 || alreadyRefunded + input.amountCents > payment.amount_cents) {
    return { ok: false, message: "Refund amount exceeds remaining refundable balance." };
  }

  const stripe = getStripeClient();
  try {
    const stripeRefund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: input.amountCents,
      reason: "requested_by_customer",
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        requested_by: input.requestedBy,
        admin_reason: input.reason.slice(0, 400),
      },
    });

    const { data: refundRow, error } = await admin
      .from("refunds")
      .insert({
        order_id: order.id,
        payment_id: payment.id,
        provider_refund_id: stripeRefund.id,
        amount_cents: input.amountCents,
        reason: input.reason,
        status: stripeRefund.status === "succeeded" ? "succeeded" : "pending",
        requested_by: input.requestedBy,
        completed_at: stripeRefund.status === "succeeded" ? new Date().toISOString() : null,
      })
      .select("id")
      .maybeSingle();

    if (error || !refundRow) {
      return { ok: false, message: "Stripe refund created but local record failed." };
    }

    if (stripeRefund.status === "succeeded") {
      const refundedCents = alreadyRefunded + input.amountCents;
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
        .update({ payment_status: paymentStatus, status: orderStatus })
        .eq("id", order.id);
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
    }

    // Explicit no-op documenting requirement #19.
    void shouldRestoreEligibilityAfterRefund();

    return { ok: true, refundId: refundRow.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create refund.";
    return { ok: false, message };
  }
}

export async function updateOrderFraudFlags(input: {
  orderId: string;
  flags: OrderFraudFlag[];
  notes: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("orders")
    .update({
      fraud_flags: input.flags,
      fraud_notes: input.notes,
    })
    .eq("id", input.orderId);
  if (error) {
    return { ok: false, message: "Unable to update fraud flags." };
  }
  return { ok: true, message: "Fraud flags saved." };
}
