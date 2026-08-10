import type {
  Cart,
  CartItem,
  CommerceCurrency,
  PersonalizationSnapshot,
  Product,
  ProductImage,
  ProductVariant,
  ShippingMethod,
  ShippingQuoteRecord,
  ShippingZone,
} from "@/types/commerce";
import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type CartRow = Database["public"]["Tables"]["carts"]["Row"];
type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];
type ZoneRow = Database["public"]["Tables"]["shipping_zones"]["Row"];
type MethodRow = Database["public"]["Tables"]["shipping_methods"]["Row"];
type QuoteRow = Database["public"]["Tables"]["shipping_quotes"]["Row"];

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    productType: row.product_type,
    active: row.active,
    requiresAwardEligibility: row.requires_award_eligibility,
    requiresShipping: row.requires_shipping,
    featured: row.featured,
    maxQuantity: row.max_quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVariant(row: VariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    sku: row.sku,
    currencyCode: row.currency_code as CommerceCurrency,
    priceCents: row.price_cents,
    weightGrams: row.weight_grams,
    lengthMm: row.length_mm,
    widthMm: row.width_mm,
    heightMm: row.height_mm,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProductImage(row: ImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    productVariantId: row.product_variant_id,
    storagePath: row.storage_path,
    altText: row.alt_text,
    displayOrder: row.display_order,
  };
}

export function mapCart(row: CartRow): Cart {
  return {
    id: row.id,
    userId: row.user_id,
    anonymousTokenHash: row.anonymous_token_hash,
    currencyCode: row.currency_code as CommerceCurrency | null,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCartItem(row: CartItemRow): CartItem {
  return {
    id: row.id,
    cartId: row.cart_id,
    productVariantId: row.product_variant_id,
    awardEligibilityId: row.award_eligibility_id,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    personalizationSnapshot: (row.personalization_snapshot ?? {}) as
      | PersonalizationSnapshot
      | Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapShippingZone(row: ZoneRow): ShippingZone {
  return {
    id: row.id,
    name: row.name,
    countryCode: row.country_code,
    administrativeRegionCodes: row.administrative_region_codes ?? [],
    postalCodePatterns: row.postal_code_patterns ?? [],
    active: row.active,
  };
}

export function mapShippingMethod(row: MethodRow): ShippingMethod {
  return {
    id: row.id,
    shippingZoneId: row.shipping_zone_id,
    name: row.name,
    description: row.description,
    pricingMethod: row.pricing_method,
    basePriceCents: row.base_price_cents,
    pricePerItemCents: row.price_per_item_cents,
    handlingFeeCents: row.handling_fee_cents,
    estimatedMinDays: row.estimated_min_days,
    estimatedMaxDays: row.estimated_max_days,
    currencyCode: row.currency_code as CommerceCurrency,
    active: row.active,
  };
}

export function mapShippingQuote(row: QuoteRow): ShippingQuoteRecord {
  return {
    id: row.id,
    cartId: row.cart_id,
    shippingMethodId: row.shipping_method_id,
    destinationSnapshot: (row.destination_snapshot ?? {}) as Record<string, unknown>,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
