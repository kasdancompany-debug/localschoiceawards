import "server-only";

import { clientEnv } from "@/lib/env/client";
import { getBusinessPromotionProduct } from "@/lib/commerce/catalog";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { getStripeClient } from "@/lib/payments/stripe";
import type { CommerceCurrency } from "@/types/commerce";

export type StartPromoteCheckoutResult =
  | { ok: true; checkoutUrl: string; promotionId: string }
  | { ok: false; message: string };

export async function startBusinessPromoteCheckout(input: {
  businessId: string;
  communityId: string;
  businessName: string;
  customerEmail: string;
  currencyCode: CommerceCurrency;
  userId?: string | null;
  returnBaseUrl?: string;
}): Promise<StartPromoteCheckoutResult> {
  const email = input.customerEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Enter a valid email for the promotion receipt." };
  }

  const product = await getBusinessPromotionProduct(input.currencyCode);
  const variant = product?.variants.find((item) => item.currencyCode === input.currencyCode);
  if (!product || !variant) {
    return { ok: false, message: "Business promotion is not available right now." };
  }

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("business_promotions")
    .select("id, status")
    .eq("business_id", input.businessId)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      message: "This business already has an active promotion subscription.",
    };
  }

  const { data: promotion, error } = await admin
    .from("business_promotions")
    .insert({
      business_id: input.businessId,
      community_id: input.communityId,
      customer_email: email,
      user_id: input.userId ?? null,
      currency_code: input.currencyCode,
      amount_cents: variant.priceCents,
      status: "incomplete",
    })
    .select("id")
    .maybeSingle();

  if (error || !promotion) {
    return { ok: false, message: "Unable to start promotion checkout." };
  }

  const appUrl = (input.returnBaseUrl || clientEnv.NEXT_PUBLIC_APP_URL).replace(/\/$/, "");
  const stripe = getStripeClient();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      client_reference_id: promotion.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currencyCode.toLowerCase(),
            unit_amount: variant.priceCents,
            recurring: { interval: "month" },
            product_data: {
              name: `${product.name} · ${input.businessName}`,
              description: product.description,
            },
          },
        },
      ],
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      success_url: `${appUrl}/order/promote/success?promotionId=${promotion.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/order/promote/cancelled?promotionId=${promotion.id}`,
      metadata: {
        promotion_id: promotion.id,
        business_id: input.businessId,
        community_id: input.communityId,
        kind: "business_promotion",
      },
      subscription_data: {
        metadata: {
          promotion_id: promotion.id,
          business_id: input.businessId,
          community_id: input.communityId,
          kind: "business_promotion",
        },
      },
    });

    if (!session.url) {
      await admin.from("business_promotions").delete().eq("id", promotion.id);
      return { ok: false, message: "Stripe did not return a checkout URL." };
    }

    await admin
      .from("business_promotions")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
      })
      .eq("id", promotion.id);

    return { ok: true, checkoutUrl: session.url, promotionId: promotion.id };
  } catch (error) {
    await admin.from("business_promotions").delete().eq("id", promotion.id);
    const message =
      error instanceof Error ? error.message : "Unable to start promotion checkout.";
    return { ok: false, message };
  }
}

export async function activatePromotionFromCheckoutSession(session: {
  id: string;
  mode: string | null;
  metadata: Record<string, string> | null;
  customer: string | { id?: string } | null;
  customer_details?: { email?: string | null } | null;
  subscription: string | { id?: string } | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (session.mode !== "subscription") {
    return { ok: false, message: "Not a subscription checkout session." };
  }

  const promotionId = session.metadata?.promotion_id ?? null;
  if (!promotionId) {
    return { ok: false, message: "Missing promotion metadata on Checkout Session." };
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const admin = createSupabaseAdminClient();
  const { data: promotion } = await admin
    .from("business_promotions")
    .select("id, status")
    .eq("id", promotionId)
    .maybeSingle();

  if (!promotion) {
    return { ok: false, message: "Promotion record not found." };
  }

  if (promotion.status === "active") {
    return { ok: true };
  }

  await admin
    .from("business_promotions")
    .update({
      status: "active",
      stripe_checkout_session_id: session.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      ...(session.customer_details?.email
        ? { customer_email: session.customer_details.email }
        : {}),
    })
    .eq("id", promotionId);

  return { ok: true };
}

export async function syncPromotionFromSubscription(subscription: {
  id: string;
  status: string;
  customer: string | { id?: string } | null;
  metadata: Record<string, string> | null;
  current_period_end?: number | null;
  canceled_at?: number | null;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const promotionId = subscription.metadata?.promotion_id ?? null;

  let query = admin.from("business_promotions").select("id").limit(1);
  query = promotionId
    ? query.eq("id", promotionId)
    : query.eq("stripe_subscription_id", subscription.id);

  const { data: promotion } = await query.maybeSingle();
  if (!promotion) {
    return;
  }

  const statusMap: Record<
    string,
    "incomplete" | "active" | "past_due" | "canceled" | "unpaid"
  > = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    unpaid: "unpaid",
    canceled: "canceled",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
  };

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  await admin
    .from("business_promotions")
    .update({
      status: statusMap[subscription.status] ?? "incomplete",
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("id", promotion.id);
}

export async function businessHasActivePromotion(businessId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("business_promotions")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}
