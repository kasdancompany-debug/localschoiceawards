import type {
  FulfillmentMethod,
  FulfillmentStatus,
  ProductionPersonalizationRecord,
  SupplierCustomerSnapshot,
} from "@/types/fulfillment";

export type SupplierRouteCandidate = {
  supplierId: string;
  supplierName: string;
  countryCode: "CA" | "US";
  currencyCode: "CAD" | "USD";
  active: boolean;
  fulfillmentMethod: FulfillmentMethod;
  manufacturingCostCents: number;
  setupCostCents: number;
  supplierShippingCostCents: number;
  coversAllVariants: boolean;
};

export function destinationCountryFromAddress(
  snapshot: Record<string, unknown> | null | undefined,
): "CA" | "US" | null {
  const country = typeof snapshot?.country === "string" ? snapshot.country.toUpperCase() : null;
  if (country === "CA" || country === "US") {
    return country;
  }
  return null;
}

/**
 * Prefer destination-matched active suppliers that cover all variants,
 * then lowest combined manufacturing + setup + supplier shipping cost.
 */
export function rankSupplierCandidates(input: {
  destinationCountry: "CA" | "US";
  candidates: SupplierRouteCandidate[];
}): SupplierRouteCandidate[] {
  return [...input.candidates]
    .filter((candidate) => candidate.active && candidate.coversAllVariants)
    .sort((a, b) => {
      const aMatch = a.countryCode === input.destinationCountry ? 0 : 1;
      const bMatch = b.countryCode === input.destinationCountry ? 0 : 1;
      if (aMatch !== bMatch) {
        return aMatch - bMatch;
      }
      const aCost = a.manufacturingCostCents + a.setupCostCents + a.supplierShippingCostCents;
      const bCost = b.manufacturingCostCents + b.setupCostCents + b.supplierShippingCostCents;
      if (aCost !== bCost) {
        return aCost - bCost;
      }
      return a.supplierName.localeCompare(b.supplierName);
    });
}

export function selectSupplierForOrder(input: {
  destinationCountry: "CA" | "US";
  candidates: SupplierRouteCandidate[];
}): SupplierRouteCandidate | null {
  return rankSupplierCandidates(input)[0] ?? null;
}

export function assertOrderPaidForFulfillment(paymentStatus: string): boolean {
  return paymentStatus === "paid" || paymentStatus === "partially_refunded";
}

export function buildSubmissionIdempotencyKey(input: {
  orderId: string;
  supplierId: string;
  parentFulfillmentId?: string | null;
}): string {
  return [
    "fulfill",
    input.orderId,
    input.supplierId,
    input.parentFulfillmentId ?? "primary",
  ].join(":");
}

export function canSubmitFulfillment(input: {
  existingStatuses: FulfillmentStatus[];
}): { ok: true } | { ok: false; reason: "duplicate_production_order" } {
  const blocking = input.existingStatuses.some(
    (status) =>
      status !== "cancelled" &&
      status !== "rejected" &&
      status !== "submission_failed",
  );
  if (blocking) {
    return { ok: false, reason: "duplicate_production_order" };
  }
  return { ok: true };
}

export function canAccessSupplierFulfillment(input: {
  actorSupplierIds: string[];
  fulfillmentSupplierId: string;
  isPlatformAdmin: boolean;
}): boolean {
  if (input.isPlatformAdmin) {
    return true;
  }
  return input.actorSupplierIds.includes(input.fulfillmentSupplierId);
}

export function buildProductionPersonalization(input: {
  orderNumber: string;
  orderItemId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  snapshot: Record<string, unknown>;
}): ProductionPersonalizationRecord {
  const businessName =
    typeof input.snapshot.businessName === "string" ? input.snapshot.businessName : "Winner";
  const communityName =
    typeof input.snapshot.communityName === "string" ? input.snapshot.communityName : "";
  const categoryName =
    typeof input.snapshot.categoryName === "string" ? input.snapshot.categoryName : "";
  const campaignYear =
    typeof input.snapshot.campaignYear === "number" ? input.snapshot.campaignYear : 0;
  const placement =
    typeof input.snapshot.placement === "string" ? input.snapshot.placement : "";
  const frozenAt =
    typeof input.snapshot.frozenAt === "string"
      ? input.snapshot.frozenAt
      : new Date().toISOString();

  return {
    orderNumber: input.orderNumber,
    orderItemId: input.orderItemId,
    productName: input.productName,
    variantName: input.variantName,
    sku: input.sku,
    quantity: input.quantity,
    businessName,
    communityName,
    categoryName,
    campaignYear,
    placement,
    frozenAt,
    artworkInstructions: [
      `Engrave/print exactly: ${businessName}`,
      placement ? `Placement: ${placement}` : null,
      categoryName ? `Category: ${categoryName}` : null,
      communityName ? `Community: ${communityName}` : null,
      campaignYear ? `Year: ${campaignYear}` : null,
      "Do not invent alternate winner wording.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/** Limit PII shared with suppliers to shipping essentials. */
export function buildSupplierCustomerSnapshot(input: {
  shippingAddress: Record<string, unknown>;
  customerEmail: string;
}): SupplierCustomerSnapshot {
  return {
    recipientName:
      typeof input.shippingAddress.name === "string" ? input.shippingAddress.name : null,
    line1: typeof input.shippingAddress.line1 === "string" ? input.shippingAddress.line1 : null,
    line2: typeof input.shippingAddress.line2 === "string" ? input.shippingAddress.line2 : null,
    city: typeof input.shippingAddress.city === "string" ? input.shippingAddress.city : null,
    region: typeof input.shippingAddress.state === "string" ? input.shippingAddress.state : null,
    postalCode:
      typeof input.shippingAddress.postalCode === "string"
        ? input.shippingAddress.postalCode
        : null,
    country:
      typeof input.shippingAddress.country === "string" ? input.shippingAddress.country : null,
    email: input.customerEmail,
  };
}

export function calculateGrossMargin(input: {
  customerMerchandiseCents: number;
  customerShippingCents: number;
  manufacturingCostCents: number;
  supplierShippingCostCents: number;
}): {
  customerRevenueCents: number;
  supplierCostCents: number;
  grossMarginCents: number;
  grossMarginPercent: number;
} {
  const customerRevenueCents = input.customerMerchandiseCents + input.customerShippingCents;
  const supplierCostCents = input.manufacturingCostCents + input.supplierShippingCostCents;
  const grossMarginCents = customerRevenueCents - supplierCostCents;
  const grossMarginPercent =
    customerRevenueCents > 0 ? (grossMarginCents / customerRevenueCents) * 100 : 0;
  return { customerRevenueCents, supplierCostCents, grossMarginCents, grossMarginPercent };
}

export function nextStatusAfterAccept(current: FulfillmentStatus): FulfillmentStatus | null {
  if (current === "submitted" || current === "remake_requested") {
    return current === "remake_requested" ? "remake_in_progress" : "accepted";
  }
  return null;
}

export function isSupplierPortalStatus(status: FulfillmentStatus): boolean {
  return [
    "submitted",
    "accepted",
    "in_production",
    "ready_to_ship",
    "shipped",
    "completed",
    "remake_requested",
    "remake_in_progress",
  ].includes(status);
}

export const NEW_ORDER_STATUSES: FulfillmentStatus[] = ["submitted", "pending_submission"];
export const ACCEPTED_STATUSES: FulfillmentStatus[] = ["accepted"];
export const IN_PRODUCTION_STATUSES: FulfillmentStatus[] = [
  "in_production",
  "remake_in_progress",
];
export const READY_TO_SHIP_STATUSES: FulfillmentStatus[] = ["ready_to_ship"];
export const SHIPPED_STATUSES: FulfillmentStatus[] = ["shipped", "completed"];
export const REMAKE_STATUSES: FulfillmentStatus[] = [
  "remake_requested",
  "remake_in_progress",
];
