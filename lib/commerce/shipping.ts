import "server-only";

import { listCartLines, computeCartTotals } from "@/lib/commerce/cart";
import { mapShippingMethod, mapShippingQuote, mapShippingZone } from "@/lib/commerce/mappers";
import {
  calculateShippingCents,
  estimateTaxCents,
  isShippingQuoteFresh,
  postalCodeMatchesPatterns,
} from "@/lib/commerce/rules";
import { writeSelectedShippingQuoteId } from "@/lib/commerce/shipping-quote-cookie";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import type { CartTotals, CommerceCurrency, ShippingMethod, ShippingQuoteRecord } from "@/types/commerce";

const QUOTE_TTL_MINUTES = 30;

export type DestinationInput = {
  countryCode: "CA" | "US";
  postalCode: string;
  administrativeRegionCode?: string;
};

export async function listShippingOptionsForDestination(input: {
  userId?: string | null;
  destination: DestinationInput;
}): Promise<
  | {
      ok: true;
      methods: Array<ShippingMethod & { shippingCents: number; quoteId: string }>;
      totals: CartTotals;
    }
  | { ok: false; message: string }
> {
  const { cart, lines } = await listCartLines({ userId: input.userId });
  if (!lines.length) {
    return { ok: false, message: "Your cart is empty." };
  }
  if (!cart.currencyCode) {
    return { ok: false, message: "Cart currency is not set." };
  }

  const requiresShipping = lines.some((line) => line.requiresShipping);
  if (!requiresShipping) {
    const totals = await computeCartTotals({
      cart,
      lines,
      shippingCents: 0,
      estimatedTaxCents: estimateTaxCents({
        countryCode: input.destination.countryCode,
        subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
        shippingCents: 0,
      }),
    });
    return { ok: true, methods: [], totals };
  }

  const admin = createSupabaseAdminClient();
  const { data: zones } = await admin
    .from("shipping_zones")
    .select("*")
    .eq("active", true)
    .eq("country_code", input.destination.countryCode);

  const matchedZones = (zones ?? [])
    .map(mapShippingZone)
    .filter((zone) => postalCodeMatchesPatterns(input.destination.postalCode, zone.postalCodePatterns));

  if (!matchedZones.length) {
    return { ok: false, message: "No shipping methods for that postal or ZIP code." };
  }

  const shippableQty = lines
    .filter((line) => line.requiresShipping)
    .reduce((sum, line) => sum + line.item.quantity, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  const methodsWithQuotes: Array<ShippingMethod & { shippingCents: number; quoteId: string }> = [];

  for (const zone of matchedZones) {
    const { data: methods } = await admin
      .from("shipping_methods")
      .select("*")
      .eq("shipping_zone_id", zone.id)
      .eq("active", true)
      .eq("currency_code", cart.currencyCode);

    for (const row of methods ?? []) {
      const method = mapShippingMethod(row);
      const shippingCents = calculateShippingCents({
        pricingMethod: method.pricingMethod,
        basePriceCents: method.basePriceCents,
        pricePerItemCents: method.pricePerItemCents,
        handlingFeeCents: method.handlingFeeCents,
        shippableItemQuantity: shippableQty,
      });

      const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000).toISOString();
      const { data: quote, error } = await admin
        .from("shipping_quotes")
        .insert({
          cart_id: cart.id,
          shipping_method_id: method.id,
          destination_snapshot: {
            countryCode: input.destination.countryCode,
            postalCode: input.destination.postalCode.trim().toUpperCase(),
            administrativeRegionCode: input.destination.administrativeRegionCode ?? null,
          },
          subtotal_cents: subtotalCents,
          shipping_cents: shippingCents,
          expires_at: expiresAt,
        })
        .select("*")
        .maybeSingle();

      if (error || !quote) {
        continue;
      }

      methodsWithQuotes.push({
        ...method,
        shippingCents,
        quoteId: quote.id,
      });
    }
  }

  if (!methodsWithQuotes.length) {
    return { ok: false, message: "Unable to price shipping for that destination." };
  }

  const first = methodsWithQuotes[0]!;
  const totals = await computeCartTotals({
    cart,
    lines,
    selectedQuoteId: first.quoteId,
    shippingCents: first.shippingCents,
    shippingMethodName: first.name,
    estimatedTaxCents: estimateTaxCents({
      countryCode: input.destination.countryCode,
      subtotalCents,
      shippingCents: first.shippingCents,
    }),
  });

  return { ok: true, methods: methodsWithQuotes, totals };
}

export async function selectShippingQuote(input: {
  userId?: string | null;
  quoteId: string;
}): Promise<{ ok: true; totals: CartTotals; quote: ShippingQuoteRecord } | { ok: false; message: string }> {
  const { cart, lines } = await listCartLines({ userId: input.userId });
  const admin = createSupabaseAdminClient();
  const { data: quoteRow } = await admin
    .from("shipping_quotes")
    .select("*, shipping_methods(name)")
    .eq("id", input.quoteId)
    .eq("cart_id", cart.id)
    .maybeSingle();

  if (!quoteRow) {
    return { ok: false, message: "Shipping quote not found." };
  }

  const quote = mapShippingQuote(quoteRow);
  if (!isShippingQuoteFresh(quote.expiresAt)) {
    return { ok: false, message: "That shipping quote expired. Enter your postal code again." };
  }

  const requiresShipping = lines.some((line) => line.requiresShipping);
  if (!requiresShipping) {
    return {
      ok: false,
      message: "Digital-only carts do not receive shipping charges.",
    };
  }

  // Never trust client shipping amounts — always use persisted quote.
  const destination = quote.destinationSnapshot as {
    countryCode?: "CA" | "US";
  };
  const totals = await computeCartTotals({
    cart,
    lines,
    selectedQuoteId: quote.id,
    shippingCents: quote.shippingCents,
    shippingMethodName:
      (quoteRow.shipping_methods as unknown as { name: string } | null)?.name ?? null,
    estimatedTaxCents: estimateTaxCents({
      countryCode: destination.countryCode === "US" ? "US" : "CA",
      subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
      shippingCents: quote.shippingCents,
    }),
  });

  await writeSelectedShippingQuoteId(quote.id);
  return { ok: true, totals, quote };
}

export function currencyForCountry(countryCode: "CA" | "US"): CommerceCurrency {
  return countryCode === "CA" ? "CAD" : "USD";
}

export async function getShippingQuoteForCart(input: {
  cartId: string;
  quoteId?: string | null;
}): Promise<{
  quote: ShippingQuoteRecord;
  methodName: string | null;
  countryCode: "CA" | "US";
} | null> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("shipping_quotes")
    .select("*, shipping_methods(name)")
    .eq("cart_id", input.cartId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (input.quoteId) {
    query = admin
      .from("shipping_quotes")
      .select("*, shipping_methods(name)")
      .eq("cart_id", input.cartId)
      .eq("id", input.quoteId)
      .gt("expires_at", new Date().toISOString())
      .limit(1);
  }

  const { data } = await query.maybeSingle();
  if (!data) {
    return null;
  }

  const quote = mapShippingQuote(data);
  const destination = quote.destinationSnapshot as { countryCode?: "CA" | "US" };
  return {
    quote,
    methodName:
      (data.shipping_methods as unknown as { name: string } | null)?.name ?? null,
    countryCode: destination.countryCode === "US" ? "US" : "CA",
  };
}
