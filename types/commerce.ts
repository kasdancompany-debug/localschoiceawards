export const PRODUCT_TYPES = ["physical", "digital", "bundle"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const COMMERCE_CURRENCIES = ["CAD", "USD"] as const;
export type CommerceCurrency = (typeof COMMERCE_CURRENCIES)[number];

export const CART_STATUSES = ["open", "converted", "abandoned", "merged"] as const;
export type CartStatus = (typeof CART_STATUSES)[number];

export const SHIPPING_PRICING_METHODS = ["flat", "per_item", "flat_plus_per_item"] as const;
export type ShippingPricingMethod = (typeof SHIPPING_PRICING_METHODS)[number];

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productType: ProductType;
  active: boolean;
  requiresAwardEligibility: boolean;
  requiresShipping: boolean;
  featured: boolean;
  maxQuantity: number;
  /** Null for one-time SKUs; set for subscription catalog items. */
  billingInterval: BillingInterval | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  currencyCode: CommerceCurrency;
  priceCents: number;
  weightGrams: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogProduct = Product & {
  variants: ProductVariant[];
};

export type ProductImage = {
  id: string;
  productId: string;
  productVariantId: string | null;
  storagePath: string;
  altText: string;
  displayOrder: number;
};

export type PersonalizationSnapshot = {
  awardEligibilityId: string;
  businessName: string;
  communityName: string;
  categoryName: string;
  campaignYear: number;
  placement: string;
  frozenAt: string;
};

export type Cart = {
  id: string;
  userId: string | null;
  anonymousTokenHash: string | null;
  currencyCode: CommerceCurrency | null;
  status: CartStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  cartId: string;
  productVariantId: string;
  awardEligibilityId: string | null;
  quantity: number;
  unitPriceCents: number;
  personalizationSnapshot: PersonalizationSnapshot | Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ShippingZone = {
  id: string;
  name: string;
  countryCode: "CA" | "US";
  administrativeRegionCodes: string[];
  postalCodePatterns: string[];
  active: boolean;
};

export type ShippingMethod = {
  id: string;
  shippingZoneId: string;
  name: string;
  description: string;
  pricingMethod: ShippingPricingMethod;
  basePriceCents: number;
  pricePerItemCents: number;
  handlingFeeCents: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  currencyCode: CommerceCurrency;
  active: boolean;
};

export type ShippingQuoteRecord = {
  id: string;
  cartId: string;
  shippingMethodId: string;
  destinationSnapshot: Record<string, unknown>;
  subtotalCents: number;
  shippingCents: number;
  expiresAt: string;
  createdAt: string;
};

export type CartLineView = {
  item: CartItem;
  productName: string;
  productSlug: string;
  variantName: string;
  currencyCode: CommerceCurrency;
  requiresShipping: boolean;
  lineTotalCents: number;
};

export type CartTotals = {
  currencyCode: CommerceCurrency | null;
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  estimatedTaxCents: number;
  totalCents: number;
  requiresShipping: boolean;
  shippingQuoteId: string | null;
  shippingMethodName: string | null;
};
