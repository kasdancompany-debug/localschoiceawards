import "server-only";

import {
  clearCartTokenCookie,
  createCartToken,
  hashCartToken,
  readCartTokenFromCookie,
  writeCartTokenCookie,
} from "@/lib/commerce/cart-token";
import { mapCart, mapCartItem, mapProduct, mapVariant } from "@/lib/commerce/mappers";
import {
  assertCartCurrencyCompatible,
  buildPersonalizationSnapshot,
  canAddQuantity,
  mergeCartItemQuantities,
  productRequiresShipping,
} from "@/lib/commerce/rules";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import type {
  Cart,
  CartItem,
  CartLineView,
  CartTotals,
  CommerceCurrency,
  PersonalizationSnapshot,
} from "@/types/commerce";
import type { Json } from "@/types/database";

const CART_TTL_DAYS = 30;

function toJson(value: PersonalizationSnapshot | Record<string, unknown>): Json {
  return value as Json;
}

function cartExpiryIso(): string {
  return new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export async function getOrCreateOpenCart(input: {
  userId?: string | null;
}): Promise<{ cart: Cart; token?: string }> {
  const admin = createSupabaseAdminClient();

  if (input.userId) {
    const { data: existing } = await admin
      .from("carts")
      .select("*")
      .eq("user_id", input.userId)
      .eq("status", "open")
      .maybeSingle();
    if (existing) {
      return { cart: mapCart(existing) };
    }

    const { data: created, error } = await admin
      .from("carts")
      .insert({
        user_id: input.userId,
        status: "open",
        expires_at: cartExpiryIso(),
      })
      .select("*")
      .maybeSingle();
    if (error || !created) {
      throw new Error("Unable to create cart.");
    }
    return { cart: mapCart(created) };
  }

  const existingToken = await readCartTokenFromCookie();
  if (existingToken) {
    const tokenHash = hashCartToken(existingToken);
    const { data: existing } = await admin
      .from("carts")
      .select("*")
      .eq("anonymous_token_hash", tokenHash)
      .eq("status", "open")
      .maybeSingle();
    if (existing) {
      return { cart: mapCart(existing), token: existingToken };
    }
  }

  const token = createCartToken();
  const { data: created, error } = await admin
    .from("carts")
    .insert({
      anonymous_token_hash: hashCartToken(token),
      status: "open",
      expires_at: cartExpiryIso(),
    })
    .select("*")
    .maybeSingle();
  if (error || !created) {
    throw new Error("Unable to create anonymous cart.");
  }
  await writeCartTokenCookie(token);
  return { cart: mapCart(created), token };
}

export async function mergeAnonymousCartIntoUser(input: {
  userId: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const token = await readCartTokenFromCookie();
  if (!token) {
    await getOrCreateOpenCart({ userId: input.userId });
    return;
  }

  const tokenHash = hashCartToken(token);
  const { data: anonCart } = await admin
    .from("carts")
    .select("*")
    .eq("anonymous_token_hash", tokenHash)
    .eq("status", "open")
    .maybeSingle();

  const userCartResult = await getOrCreateOpenCart({ userId: input.userId });
  const userCart = userCartResult.cart;

  if (!anonCart || anonCart.id === userCart.id) {
    await clearCartTokenCookie();
    return;
  }

  const { data: anonItems } = await admin
    .from("cart_items")
    .select("*")
    .eq("cart_id", anonCart.id);

  for (const row of anonItems ?? []) {
    const item = mapCartItem(row);
    const { data: variant } = await admin
      .from("product_variants")
      .select("*, products(*)")
      .eq("id", item.productVariantId)
      .maybeSingle();
    if (!variant) continue;

    const currencyCheck = assertCartCurrencyCompatible(
      userCart.currencyCode,
      variant.currency_code as CommerceCurrency,
    );
    if (!currencyCheck.ok) {
      // Skip incompatible currency lines rather than corrupting the user cart.
      continue;
    }

    if (!userCart.currencyCode) {
      await admin
        .from("carts")
        .update({ currency_code: currencyCheck.currency })
        .eq("id", userCart.id);
      userCart.currencyCode = currencyCheck.currency;
    }

    const product = mapProduct(variant.products as never);
    let existingQuery = admin
      .from("cart_items")
      .select("*")
      .eq("cart_id", userCart.id)
      .eq("product_variant_id", item.productVariantId);
    existingQuery = item.awardEligibilityId
      ? existingQuery.eq("award_eligibility_id", item.awardEligibilityId)
      : existingQuery.is("award_eligibility_id", null);
    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      const merged = mergeCartItemQuantities({
        existingQuantity: existing.quantity,
        incomingQuantity: item.quantity,
        maxQuantity: product.maxQuantity,
      });
      if (merged.ok) {
        await admin
          .from("cart_items")
          .update({ quantity: merged.quantity, unit_price_cents: variant.price_cents })
          .eq("id", existing.id);
      }
    } else {
      await admin.from("cart_items").insert({
        cart_id: userCart.id,
        product_variant_id: item.productVariantId,
        award_eligibility_id: item.awardEligibilityId,
        quantity: Math.min(item.quantity, product.maxQuantity),
        unit_price_cents: variant.price_cents,
        personalization_snapshot: toJson(item.personalizationSnapshot),
      });
    }
  }

  await admin.from("carts").update({ status: "merged" }).eq("id", anonCart.id);
  await clearCartTokenCookie();
}

export type AddToCartResult =
  | { ok: true; cartId: string }
  | {
      ok: false;
      reason:
        | "currency_mismatch"
        | "eligibility_required"
        | "eligibility_invalid"
        | "quantity_limit"
        | "variant_inactive"
        | "server_error";
      message: string;
    };

export async function addItemToCart(input: {
  userId?: string | null;
  productVariantId: string;
  awardEligibilityId?: string | null;
  quantity: number;
}): Promise<AddToCartResult> {
  const admin = createSupabaseAdminClient();
  const { cart } = await getOrCreateOpenCart({ userId: input.userId });

  const { data: variantRow } = await admin
    .from("product_variants")
    .select("*, products(*)")
    .eq("id", input.productVariantId)
    .maybeSingle();

  if (!variantRow || !variantRow.active) {
    return { ok: false, reason: "variant_inactive", message: "That product variant is unavailable." };
  }

  const product = mapProduct(variantRow.products as never);
  const variant = mapVariant(variantRow);
  if (!product.active) {
    return { ok: false, reason: "variant_inactive", message: "That product is unavailable." };
  }

  const currencyCheck = assertCartCurrencyCompatible(cart.currencyCode, variant.currencyCode);
  if (!currencyCheck.ok) {
    return {
      ok: false,
      reason: "currency_mismatch",
      message: "A cart cannot mix CAD and USD items.",
    };
  }

  let personalization: PersonalizationSnapshot | Record<string, unknown> = {};
  let eligibilityId: string | null = null;

  if (product.requiresAwardEligibility) {
    if (!input.awardEligibilityId) {
      return {
        ok: false,
        reason: "eligibility_required",
        message: "Choose an eligible published win before adding this product.",
      };
    }

    const eligibility = await loadActiveEligibility(input.awardEligibilityId, input.userId ?? null);
    if (!eligibility) {
      return {
        ok: false,
        reason: "eligibility_invalid",
        message: "That award eligibility is revoked or unavailable.",
      };
    }

    eligibilityId = eligibility.id;
    personalization = buildPersonalizationSnapshot({
      awardEligibilityId: eligibility.id,
      businessName: eligibility.personalized_business_name,
      communityName: eligibility.personalized_community_name,
      categoryName: eligibility.personalized_category_name,
      campaignYear: eligibility.personalized_campaign_year,
      placement: eligibility.placement,
    });
  }

  const { data: existing } = await (eligibilityId
    ? admin
        .from("cart_items")
        .select("*")
        .eq("cart_id", cart.id)
        .eq("product_variant_id", variant.id)
        .eq("award_eligibility_id", eligibilityId)
        .maybeSingle()
    : admin
        .from("cart_items")
        .select("*")
        .eq("cart_id", cart.id)
        .eq("product_variant_id", variant.id)
        .is("award_eligibility_id", null)
        .maybeSingle());

  const existingQty = existing?.quantity ?? 0;
  if (
    !canAddQuantity({
      maxQuantity: product.maxQuantity,
      existingQuantity: existingQty,
      addQuantity: input.quantity,
    })
  ) {
    return {
      ok: false,
      reason: "quantity_limit",
      message: `Quantity limit for this product is ${product.maxQuantity}.`,
    };
  }

  if (!cart.currencyCode) {
    await admin.from("carts").update({ currency_code: variant.currencyCode }).eq("id", cart.id);
  }

  if (existing) {
    const { error } = await admin
      .from("cart_items")
      .update({
        quantity: existingQty + input.quantity,
        unit_price_cents: variant.priceCents,
        personalization_snapshot: toJson(personalization),
      })
      .eq("id", existing.id);
    if (error) {
      return { ok: false, reason: "server_error", message: "Unable to update cart." };
    }
  } else {
    const { error } = await admin.from("cart_items").insert({
      cart_id: cart.id,
      product_variant_id: variant.id,
      award_eligibility_id: eligibilityId,
      quantity: input.quantity,
      unit_price_cents: variant.priceCents,
      personalization_snapshot: toJson(personalization),
    });
    if (error) {
      return { ok: false, reason: "server_error", message: "Unable to add to cart." };
    }
  }

  return { ok: true, cartId: cart.id };
}

async function loadActiveEligibility(eligibilityId: string, userId: string | null) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("award_eligibilities")
    .select("*")
    .eq("id", eligibilityId)
    .eq("eligibility_status", "active")
    .maybeSingle();

  if (!data) {
    return null;
  }

  if (!userId) {
    // Anonymous shoppers can stage eligibility-bound items only after login for checkout,
    // but may add when eligibility id is known and still active.
    return data;
  }

  const { data: membership } = await admin
    .from("business_memberships")
    .select("id")
    .eq("business_id", data.business_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return membership ? data : null;
}

export async function updateCartItemQuantity(input: {
  userId?: string | null;
  cartItemId: string;
  quantity: number;
}): Promise<{ ok: boolean; message: string }> {
  const { cart } = await getOrCreateOpenCart({ userId: input.userId });
  const admin = createSupabaseAdminClient();
  const { data: item } = await admin
    .from("cart_items")
    .select("*, product_variants(*, products(*))")
    .eq("id", input.cartItemId)
    .eq("cart_id", cart.id)
    .maybeSingle();

  if (!item) {
    return { ok: false, message: "Cart item not found." };
  }

  if (input.quantity <= 0) {
    await admin.from("cart_items").delete().eq("id", input.cartItemId);
    return { ok: true, message: "Item removed." };
  }

  const product = mapProduct(
    (item.product_variants as unknown as { products: Parameters<typeof mapProduct>[0] }).products,
  );
  if (input.quantity > product.maxQuantity) {
    return { ok: false, message: `Quantity limit is ${product.maxQuantity}.` };
  }

  await admin.from("cart_items").update({ quantity: input.quantity }).eq("id", input.cartItemId);
  return { ok: true, message: "Quantity updated." };
}

export async function removeCartItem(input: {
  userId?: string | null;
  cartItemId: string;
}): Promise<void> {
  const { cart } = await getOrCreateOpenCart({ userId: input.userId });
  const admin = createSupabaseAdminClient();
  await admin.from("cart_items").delete().eq("id", input.cartItemId).eq("cart_id", cart.id);
}

export async function listCartLines(input: {
  userId?: string | null;
}): Promise<{ cart: Cart; lines: CartLineView[] }> {
  const { cart } = await getOrCreateOpenCart({ userId: input.userId });
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("cart_items")
    .select("*, product_variants(*, products(*))")
    .eq("cart_id", cart.id)
    .order("created_at");

  const lines: CartLineView[] = (data ?? []).flatMap((row) => {
    const item = mapCartItem(row);
    const variantRaw = row.product_variants as unknown as Parameters<typeof mapVariant>[0] & {
      products: Parameters<typeof mapProduct>[0];
    };
    if (!variantRaw?.products) {
      return [];
    }
    const variant = mapVariant(variantRaw);
    const product = mapProduct(variantRaw.products);
    return [
      {
        item,
        productName: product.name,
        productSlug: product.slug,
        variantName: variant.name,
        currencyCode: variant.currencyCode,
        requiresShipping: productRequiresShipping(product.productType, product.requiresShipping),
        lineTotalCents: item.unitPriceCents * item.quantity,
      },
    ];
  });

  return { cart, lines };
}

export async function revalidateCartBeforeCheckout(input: {
  userId?: string | null;
}): Promise<{ ok: true; lines: CartLineView[]; totals: CartTotals } | { ok: false; message: string }> {
  const { lines } = await listCartLines(input);
  const admin = createSupabaseAdminClient();

  for (const line of lines) {
    const { data: variant } = await admin
      .from("product_variants")
      .select("*, products(*)")
      .eq("id", line.item.productVariantId)
      .maybeSingle();

    if (!variant || !variant.active) {
      return { ok: false, message: `${line.productName} is no longer available.` };
    }

    const product = mapProduct(variant.products as never);
    if (product.requiresAwardEligibility) {
      if (!line.item.awardEligibilityId) {
        return { ok: false, message: `${line.productName} requires award eligibility.` };
      }
      const eligibility = await loadActiveEligibility(
        line.item.awardEligibilityId,
        input.userId ?? null,
      );
      if (!eligibility) {
        return {
          ok: false,
          message: `Eligibility for ${line.productName} was revoked or is invalid.`,
        };
      }
    }

    if (variant.price_cents !== line.item.unitPriceCents) {
      await admin
        .from("cart_items")
        .update({ unit_price_cents: variant.price_cents })
        .eq("id", line.item.id);
      line.item.unitPriceCents = variant.price_cents;
      line.lineTotalCents = variant.price_cents * line.item.quantity;
    }
  }

  const refreshed = await listCartLines(input);
  const totals = await computeCartTotals({
    cart: refreshed.cart,
    lines: refreshed.lines,
    selectedQuoteId: null,
  });

  return { ok: true, lines: refreshed.lines, totals };
}

export async function computeCartTotals(input: {
  cart: Cart;
  lines: CartLineView[];
  selectedQuoteId?: string | null;
  shippingCents?: number;
  shippingMethodName?: string | null;
  estimatedTaxCents?: number;
}): Promise<CartTotals> {
  const subtotalCents = input.lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const itemCount = input.lines.reduce((sum, line) => sum + line.item.quantity, 0);
  const requiresShipping = input.lines.some((line) => line.requiresShipping);

  let shippingCents = 0;
  let shippingQuoteId: string | null = input.selectedQuoteId ?? null;
  let shippingMethodName = input.shippingMethodName ?? null;

  if (typeof input.shippingCents === "number") {
    shippingCents = requiresShipping ? input.shippingCents : 0;
  } else if (shippingQuoteId) {
    const admin = createSupabaseAdminClient();
    const { data: quote } = await admin
      .from("shipping_quotes")
      .select("*, shipping_methods(name)")
      .eq("id", shippingQuoteId)
      .eq("cart_id", input.cart.id)
      .maybeSingle();
    if (quote && new Date(quote.expires_at).getTime() > Date.now()) {
      shippingCents = requiresShipping ? quote.shipping_cents : 0;
      shippingMethodName =
        (quote.shipping_methods as unknown as { name: string } | null)?.name ?? null;
    } else {
      shippingQuoteId = null;
      shippingCents = 0;
    }
  }

  if (!requiresShipping) {
    shippingCents = 0;
    shippingQuoteId = null;
    shippingMethodName = null;
  }

  const estimatedTaxCents = input.estimatedTaxCents ?? 0;
  const currencyCode = input.cart.currencyCode ?? input.lines[0]?.currencyCode ?? null;

  return {
    currencyCode,
    itemCount,
    subtotalCents,
    shippingCents,
    estimatedTaxCents,
    totalCents: subtotalCents + shippingCents + estimatedTaxCents,
    requiresShipping,
    shippingQuoteId,
    shippingMethodName,
  };
}

export async function listEligibilitiesForUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data: memberships } = await admin
    .from("business_memberships")
    .select("business_id")
    .eq("user_id", userId)
    .eq("status", "active");

  const businessIds = (memberships ?? []).map((row) => row.business_id);
  if (!businessIds.length) {
    return [];
  }

  const { data } = await admin
    .from("award_eligibilities")
    .select("*")
    .in("business_id", businessIds)
    .eq("eligibility_status", "active")
    .order("personalized_campaign_year", { ascending: false });

  return data ?? [];
}

export type { CartItem };
