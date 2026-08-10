export const FULFILLMENT_METHODS = ["portal", "email", "api"] as const;
export type FulfillmentMethod = (typeof FULFILLMENT_METHODS)[number];

export const SUPPLIER_USER_ROLES = ["owner", "manager", "operator", "viewer"] as const;
export type SupplierUserRole = (typeof SUPPLIER_USER_ROLES)[number];

export const FULFILLMENT_STATUSES = [
  "pending_submission",
  "submission_failed",
  "submitted",
  "accepted",
  "rejected",
  "in_production",
  "ready_to_ship",
  "shipped",
  "completed",
  "cancelled",
  "remake_requested",
  "remake_in_progress",
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const SUPPLIER_PAYMENT_STATUSES = ["unpaid", "pending", "paid", "waived"] as const;
export type SupplierPaymentStatus = (typeof SUPPLIER_PAYMENT_STATUSES)[number];

export const SHIPMENT_STATUSES = [
  "pending",
  "shipped",
  "in_transit",
  "delivered",
  "exception",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type ProductionPersonalizationRecord = {
  orderNumber: string;
  orderItemId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  businessName: string;
  communityName: string;
  categoryName: string;
  campaignYear: number;
  placement: string;
  frozenAt: string;
  artworkInstructions: string;
};

export type SupplierCustomerSnapshot = {
  recipientName: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  email: string | null;
};

export type Supplier = {
  id: string;
  name: string;
  legalName: string;
  countryCode: "CA" | "US";
  currencyCode: "CAD" | "USD";
  contactEmail: string;
  supportEmail: string;
  fulfillmentMethod: FulfillmentMethod;
  apiBaseUrl: string | null;
  stripeConnectedAccountId: string | null;
  productionMinDays: number;
  productionMaxDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplierProduct = {
  id: string;
  supplierId: string;
  productVariantId: string;
  supplierSku: string;
  manufacturingCostCents: number;
  setupCostCents: number;
  supplierCurrencyCode: "CAD" | "USD";
  active: boolean;
};

export type Fulfillment = {
  id: string;
  orderId: string;
  supplierId: string;
  parentFulfillmentId: string | null;
  status: FulfillmentStatus;
  supplierOrderReference: string | null;
  submissionIdempotencyKey: string;
  manufacturingCostCents: number;
  supplierShippingCostCents: number;
  supplierPaymentStatus: SupplierPaymentStatus;
  destinationCountryCode: "CA" | "US" | null;
  customerSnapshot: SupplierCustomerSnapshot | Record<string, unknown>;
  productionPersonalization: Record<string, unknown>;
  rejectionReason: string;
  remakeReason: string;
  submittedAt: string | null;
  acceptedAt: string | null;
  productionStartedAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FulfillmentItem = {
  id: string;
  fulfillmentId: string;
  orderItemId: string;
  supplierProductId: string;
  artworkStoragePath: string | null;
  productionNotes: string;
  personalizationRecord: ProductionPersonalizationRecord | Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Shipment = {
  id: string;
  fulfillmentId: string;
  carrier: string;
  service: string;
  trackingNumber: string;
  trackingUrl: string;
  shippedAt: string;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  status: ShipmentStatus;
  trackingEmailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderMarginReport = {
  orderId: string;
  orderNumber: string;
  currencyCode: "CAD" | "USD";
  customerMerchandiseCents: number;
  customerShippingCents: number;
  customerRevenueCents: number;
  manufacturingCostCents: number;
  supplierShippingCostCents: number;
  supplierCostCents: number;
  grossMarginCents: number;
  grossMarginPercent: number;
};
