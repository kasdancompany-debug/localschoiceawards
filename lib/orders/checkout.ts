import "server-only";

import { clientEnv } from "@/lib/env/client";
import {
  listCartLines,
  revalidateCartBeforeCheckout,
} from "@/lib/commerce/cart";
import { mapProduct, mapVariant } from "@/lib/commerce/mappers";
import { getShippingQuoteForCart } from "@/lib/commerce/shipping";
import { readSelectedShippingQuoteId } from "@/lib/commerce/shipping-quote-cookie";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { toJson } from "@/lib/orders/mappers";
import {
  assertServerTotalsTrusted,
  assertShippingQuoteUsable,
  assertUnitPricesUnaltered,
  buildStripeCheckoutLineItems,
  computeOrderTotalCents,
} from "@/lib/orders/rules";
import { getStripeClient } from "@/lib/payments/stripe";
import type { OrderWithItems } from "@/types/orders";
import { getOrderById } from "@/lib/orders/queries";

export type StartCheckoutResult =
  | { ok: true; orderId: string; orderNumber: string; checkoutUrl: string }
  | { ok: false; message: string };

function personalizationDescription(snapshot: Record<string, unknown>): string | undefined {
  const business = typeof snapshot.businessName === "string" ? snapshot.businessName : null;
  const category = typeof snapshot.categoryName === "string" ? snapshot.categoryName : null;
  const year = typeof snapshot.campaignYear === "number" ? snapshot.campaignYear : null;
  if (!business) {
    return undefined;
  }
  return [business, category, year].filter(Boolean).join(" · ");
}

export async function startStripeCheckout(input: {
  userId?: string | null;
  customerEmail: string;
  clientTotalCents?: number | null;
  returnBaseUrl?: string;
}): Promise<StartCheckoutResult> {
  const email = input.customerEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Enter a valid email for your receipt." };
  }

  const revalidated = await revalidateCartBeforeCheckout({ userId: input.userId ?? null });
  if (!revalidated.ok) {
    return { ok: false, message: revalidated.message };
  }

  const { cart, lines } = await listCartLines({ userId: input.userId ?? null });
  if (!lines.length) {
    return { ok: false, message: "Your cart is empty." };
  }
  if (!cart.currencyCode) {
    return { ok: false, message: "Cart currency is not set." };
  }

  const admin = createSupabaseAdminClient();

  // Re-read catalog prices and refuse altered cart prices that somehow diverge.
  const priceChecks: Array<{
    cartUnitPriceCents: number;
    catalogUnitPriceCents: number;
    productName: string;
  }> = [];

  for (const line of lines) {
    const { data: variant } = await admin
      .from("product_variants")
      .select("*, products(*)")
      .eq("id", line.item.productVariantId)
      .maybeSingle();
    if (!variant?.active || !variant.products) {
      return { ok: false, message: `${line.productName} is unavailable.` };
    }
    const product = mapProduct(variant.products as never);
    if (!product.active) {
      return { ok: false, message: `${line.productName} is unavailable.` };
    }
    priceChecks.push({
      cartUnitPriceCents: line.item.unitPriceCents,
      catalogUnitPriceCents: variant.price_cents,
      productName: line.productName,
    });
  }

  const priceGuard = assertUnitPricesUnaltered({ lines: priceChecks });
  if (!priceGuard.ok) {
    return {
      ok: false,
      message: `Price changed for ${priceGuard.productName}. Refresh your cart and try again.`,
    };
  }

  const requiresShipping = lines.some((line) => line.requiresShipping);
  const selectedQuoteId = await readSelectedShippingQuoteId();
  const selected = await getShippingQuoteForCart({
    cartId: cart.id,
    quoteId: selectedQuoteId,
  });

  const shippingGuard = assertShippingQuoteUsable({
    requiresShipping,
    quoteExpiresAt: selected?.quote.expiresAt ?? null,
    quoteShippingCents: selected?.quote.shippingCents ?? null,
  });
  if (!shippingGuard.ok) {
    return {
      ok: false,
      message:
        shippingGuard.reason === "quote_expired"
          ? "Your shipping quote expired. Enter your postal or ZIP code again."
          : "Select a shipping method before checkout.",
    };
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const shippingCents = shippingGuard.shippingCents;
  // Tax is calculated by Stripe Automatic Tax; pending order starts at 0 until webhook.
  const taxCents = 0;
  const discountCents = 0;
  const totalsGuard = assertServerTotalsTrusted({
    clientTotalCents: input.clientTotalCents,
    server: { subtotalCents, shippingCents, taxCents, discountCents },
  });
  if (!totalsGuard.ok) {
    return { ok: false, message: "Totals could not be verified. Refresh and try again." };
  }

  const totalCents = computeOrderTotalCents({
    subtotalCents,
    shippingCents,
    taxCents,
    discountCents,
  });

  let businessId: string | null = null;
  for (const line of lines) {
    if (!line.item.awardEligibilityId) continue;
    const { data: eligibility } = await admin
      .from("award_eligibilities")
      .select("business_id")
      .eq("id", line.item.awardEligibilityId)
      .maybeSingle();
    if (eligibility?.business_id) {
      businessId = eligibility.business_id;
      break;
    }
  }

  const { data: orderNumberData, error: orderNumberError } = await admin.rpc(
    "generate_order_number",
  );
  if (orderNumberError || typeof orderNumberData !== "string") {
    return { ok: false, message: "Unable to allocate an order number." };
  }

  const shippingMethodSnapshot = selected
    ? {
        quoteId: selected.quote.id,
        methodId: selected.quote.shippingMethodId,
        methodName: selected.methodName,
        shippingCents: selected.quote.shippingCents,
        destination: selected.quote.destinationSnapshot,
        expiresAt: selected.quote.expiresAt,
      }
    : { methodName: "Digital delivery", shippingCents: 0 };

  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumberData,
      user_id: input.userId ?? null,
      business_id: businessId,
      cart_id: cart.id,
      currency_code: cart.currencyCode,
      status: "awaiting_payment",
      payment_status: "pending",
      fulfillment_status: "not_started",
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: taxCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      shipping_method_snapshot: toJson(shippingMethodSnapshot),
      shipping_address_snapshot: toJson({}),
      billing_address_snapshot: toJson({}),
      customer_email: email,
    })
    .select("*")
    .maybeSingle();

  if (orderError || !orderRow) {
    return { ok: false, message: "Unable to create pending order." };
  }

  for (const line of lines) {
    const { data: variant } = await admin
      .from("product_variants")
      .select("*, products(*)")
      .eq("id", line.item.productVariantId)
      .maybeSingle();
    if (!variant?.products) {
      await admin.from("orders").update({ status: "cancelled" }).eq("id", orderRow.id);
      return { ok: false, message: "Unable to freeze order line snapshots." };
    }
    const product = mapProduct(variant.products as never);
    const mappedVariant = mapVariant(variant);
    const { error: itemError } = await admin.from("order_items").insert({
      order_id: orderRow.id,
      product_id: product.id,
      product_variant_id: mappedVariant.id,
      award_eligibility_id: line.item.awardEligibilityId,
      product_name_snapshot: product.name,
      variant_name_snapshot: mappedVariant.name,
      sku_snapshot: mappedVariant.sku,
      quantity: line.item.quantity,
      unit_price_cents: mappedVariant.priceCents,
      personalization_snapshot: toJson(
        line.item.personalizationSnapshot as Record<string, unknown>,
      ),
    });
    if (itemError) {
      await admin.from("orders").update({ status: "cancelled" }).eq("id", orderRow.id);
      return { ok: false, message: "Unable to freeze order items." };
    }
  }

  const appUrl = (input.returnBaseUrl || clientEnv.NEXT_PUBLIC_APP_URL).replace(/\/$/, "");
  const stripe = getStripeClient();
  const lineItems = buildStripeCheckoutLineItems({
    currencyCode: cart.currencyCode,
    merchandise: lines.map((line) => ({
      name: line.productName,
      description: personalizationDescription(
        line.item.personalizationSnapshot as Record<string, unknown>,
      ),
      unitPriceCents: line.item.unitPriceCents,
      quantity: line.item.quantity,
    })),
    shippingCents,
    shippingLabel:
      selected?.methodName ??
      (typeof shippingMethodSnapshot.methodName === "string"
        ? shippingMethodSnapshot.methodName
        : "Shipping"),
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: orderRow.id,
      line_items: lineItems,
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      shipping_address_collection: requiresShipping
        ? { allowed_countries: ["CA", "US"] }
        : undefined,
      success_url: `${appUrl}/checkout/success?orderId=${orderRow.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancelled?orderId=${orderRow.id}`,
      metadata: {
        order_id: orderRow.id,
        order_number: orderNumberData,
      },
      payment_intent_data: {
        metadata: {
          order_id: orderRow.id,
          order_number: orderNumberData,
        },
      },
    });

    if (!session.url) {
      await admin.from("orders").update({ status: "cancelled" }).eq("id", orderRow.id);
      return { ok: false, message: "Stripe did not return a checkout URL." };
    }

    await admin
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
      })
      .eq("id", orderRow.id);

    return {
      ok: true,
      orderId: orderRow.id,
      orderNumber: orderNumberData,
      checkoutUrl: session.url,
    };
  } catch (error) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", orderRow.id);
    const message = error instanceof Error ? error.message : "Unable to start Stripe Checkout.";
    return { ok: false, message };
  }
}

export async function loadCheckoutPreview(userId?: string | null): Promise<
  | {
      ok: true;
      orderPreview: {
        currencyCode: string;
        subtotalCents: number;
        shippingCents: number;
        estimatedTaxNote: string;
        totalBeforeTaxCents: number;
        requiresShipping: boolean;
        shippingReady: boolean;
        shippingMethodName: string | null;
        shippingBlockedReason: string | null;
        lines: Array<{
          productName: string;
          quantity: number;
          unitPriceCents: number;
          lineTotalCents: number;
        }>;
      };
    }
  | { ok: false; message: string }
> {
  const { cart, lines } = await listCartLines({ userId: userId ?? null });
  if (!lines.length) {
    return { ok: false, message: "Your cart is empty." };
  }

  const requiresShipping = lines.some((line) => line.requiresShipping);
  const selectedQuoteId = await readSelectedShippingQuoteId();
  const selected = await getShippingQuoteForCart({
    cartId: cart.id,
    quoteId: selectedQuoteId,
  });
  const shippingGuard = assertShippingQuoteUsable({
    requiresShipping,
    quoteExpiresAt: selected?.quote.expiresAt ?? null,
    quoteShippingCents: selected?.quote.shippingCents ?? null,
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const shippingCents = shippingGuard.ok ? shippingGuard.shippingCents : 0;

  return {
    ok: true,
    orderPreview: {
      currencyCode: cart.currencyCode ?? lines[0]?.currencyCode ?? "CAD",
      subtotalCents,
      shippingCents,
      estimatedTaxNote: "Applicable tax is calculated by Stripe Automatic Tax at payment.",
      totalBeforeTaxCents: subtotalCents + shippingCents,
      requiresShipping,
      shippingReady: shippingGuard.ok,
      shippingMethodName: selected?.methodName ?? null,
      shippingBlockedReason: shippingGuard.ok
        ? null
        : shippingGuard.reason === "quote_expired"
          ? "Your shipping quote expired. Return to the cart and re-enter your postal or ZIP code."
          : "Select a shipping method on the cart page before paying.",
      lines: lines.map((line) => ({
        productName: line.productName,
        quantity: line.item.quantity,
        unitPriceCents: line.item.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
      })),
    },
  };
}

export async function getOrderForUser(input: {
  orderId: string;
  userId: string;
}): Promise<OrderWithItems | null> {
  const order = await getOrderById(input.orderId);
  if (!order || order.userId !== input.userId) {
    return null;
  }
  return order;
}
