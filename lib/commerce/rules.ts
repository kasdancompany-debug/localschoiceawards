import type {
  CommerceCurrency,
  PersonalizationSnapshot,
  ProductType,
  ShippingPricingMethod,
} from "@/types/commerce";

export type CartCurrencyFailure = "currency_mismatch" | "empty_currency";

export function assertCartCurrencyCompatible(
  cartCurrency: CommerceCurrency | null | undefined,
  itemCurrency: CommerceCurrency,
): { ok: true; currency: CommerceCurrency } | { ok: false; reason: CartCurrencyFailure } {
  if (!cartCurrency) {
    return { ok: true, currency: itemCurrency };
  }
  if (cartCurrency !== itemCurrency) {
    return { ok: false, reason: "currency_mismatch" };
  }
  return { ok: true, currency: cartCurrency };
}

export function productRequiresShipping(productType: ProductType, requiresShipping: boolean): boolean {
  if (productType === "digital") {
    return false;
  }
  return requiresShipping;
}

export function calculateShippingCents(input: {
  pricingMethod: ShippingPricingMethod;
  basePriceCents: number;
  pricePerItemCents: number;
  handlingFeeCents: number;
  shippableItemQuantity: number;
}): number {
  const qty = Math.max(0, input.shippableItemQuantity);
  switch (input.pricingMethod) {
    case "flat":
      return qty > 0 ? input.basePriceCents + input.handlingFeeCents : 0;
    case "per_item":
      return qty > 0 ? qty * input.pricePerItemCents + input.handlingFeeCents : 0;
    case "flat_plus_per_item":
      return qty > 0
        ? input.basePriceCents + qty * input.pricePerItemCents + input.handlingFeeCents
        : 0;
    default:
      return 0;
  }
}

export function estimateTaxCents(input: {
  countryCode: "CA" | "US";
  subtotalCents: number;
  shippingCents: number;
}): number {
  // Conservative pre-checkout estimate only — final tax is determined at payment later.
  if (input.countryCode === "CA") {
    return Math.round((input.subtotalCents + input.shippingCents) * 0.13);
  }
  return 0;
}

export function buildPersonalizationSnapshot(input: {
  awardEligibilityId: string;
  businessName: string;
  communityName: string;
  categoryName: string;
  campaignYear: number;
  placement: string;
  frozenAt?: string;
}): PersonalizationSnapshot {
  return {
    awardEligibilityId: input.awardEligibilityId,
    businessName: input.businessName,
    communityName: input.communityName,
    categoryName: input.categoryName,
    campaignYear: input.campaignYear,
    placement: input.placement,
    frozenAt: input.frozenAt ?? new Date().toISOString(),
  };
}

export function canAddQuantity(input: {
  maxQuantity: number;
  existingQuantity: number;
  addQuantity: number;
}): boolean {
  return input.existingQuantity + input.addQuantity <= input.maxQuantity && input.addQuantity > 0;
}

export function postalCodeMatchesPatterns(postalCode: string, patterns: string[]): boolean {
  const normalized = postalCode.trim();
  if (!patterns.length) {
    return Boolean(normalized);
  }
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern, "i").test(normalized);
    } catch {
      return false;
    }
  });
}

export function isShippingQuoteFresh(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() > now.getTime();
}

export function mergeCartItemQuantities(input: {
  existingQuantity: number;
  incomingQuantity: number;
  maxQuantity: number;
}): { ok: true; quantity: number } | { ok: false; reason: "quantity_limit" } {
  const quantity = input.existingQuantity + input.incomingQuantity;
  if (quantity > input.maxQuantity) {
    return { ok: false, reason: "quantity_limit" };
  }
  return { ok: true, quantity };
}

export type AnonymousMergeLine = {
  productVariantId: string;
  awardEligibilityId: string | null;
  quantity: number;
  currencyCode: CommerceCurrency;
  maxQuantity: number;
  eligibilityActive: boolean;
  requiresAwardEligibility: boolean;
};

export type AnonymousMergePlan =
  | { action: "merge"; quantity: number }
  | { action: "skip"; reason: "currency_mismatch" | "eligibility_invalid" | "quantity_limit" };

/**
 * Pure merge planner for anonymous → user cart. Currency mismatches and
 * revoked eligibility are skipped so the account cart stays valid.
 */
export function planAnonymousCartLineMerge(input: {
  userCartCurrency: CommerceCurrency | null;
  existingQuantity: number;
  line: AnonymousMergeLine;
}): AnonymousMergePlan {
  const currency = assertCartCurrencyCompatible(
    input.userCartCurrency,
    input.line.currencyCode,
  );
  if (!currency.ok) {
    return { action: "skip", reason: "currency_mismatch" };
  }

  if (input.line.requiresAwardEligibility && !input.line.eligibilityActive) {
    return { action: "skip", reason: "eligibility_invalid" };
  }

  const merged = mergeCartItemQuantities({
    existingQuantity: input.existingQuantity,
    incomingQuantity: input.line.quantity,
    maxQuantity: input.line.maxQuantity,
  });
  if (!merged.ok) {
    return { action: "skip", reason: "quantity_limit" };
  }

  return { action: "merge", quantity: merged.quantity };
}

export function formatMoney(cents: number, currency: CommerceCurrency): string {
  return new Intl.NumberFormat(currency === "CAD" ? "en-CA" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function cartReviewLines(input: {
  subtotalCents: number;
  shippingCents: number;
  estimatedTaxCents: number;
  requiresShipping: boolean;
}): {
  subtotalCents: number;
  shippingCents: number;
  estimatedTaxCents: number;
  totalCents: number;
} {
  const shippingCents = input.requiresShipping ? Math.max(0, input.shippingCents) : 0;
  return {
    subtotalCents: input.subtotalCents,
    shippingCents,
    estimatedTaxCents: input.estimatedTaxCents,
    totalCents: input.subtotalCents + shippingCents + input.estimatedTaxCents,
  };
}
