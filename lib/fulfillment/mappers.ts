import type {
  Fulfillment,
  FulfillmentItem,
  FulfillmentMethod,
  FulfillmentStatus,
  Shipment,
  ShipmentStatus,
  Supplier,
  SupplierPaymentStatus,
  SupplierProduct,
  ProductionPersonalizationRecord,
  SupplierCustomerSnapshot,
} from "@/types/fulfillment";
import type { Database, Json } from "@/types/database";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierProductRow = Database["public"]["Tables"]["supplier_products"]["Row"];
type FulfillmentRow = Database["public"]["Tables"]["fulfillments"]["Row"];
type FulfillmentItemRow = Database["public"]["Tables"]["fulfillment_items"]["Row"];
type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];

export function mapSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    countryCode: row.country_code,
    currencyCode: row.currency_code,
    contactEmail: row.contact_email,
    supportEmail: row.support_email,
    fulfillmentMethod: row.fulfillment_method as FulfillmentMethod,
    apiBaseUrl: row.api_base_url,
    stripeConnectedAccountId: row.stripe_connected_account_id,
    productionMinDays: row.production_min_days,
    productionMaxDays: row.production_max_days,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSupplierProduct(row: SupplierProductRow): SupplierProduct {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    productVariantId: row.product_variant_id,
    supplierSku: row.supplier_sku,
    manufacturingCostCents: row.manufacturing_cost_cents,
    setupCostCents: row.setup_cost_cents,
    supplierCurrencyCode: row.supplier_currency_code,
    active: row.active,
  };
}

export function mapFulfillment(row: FulfillmentRow): Fulfillment {
  return {
    id: row.id,
    orderId: row.order_id,
    supplierId: row.supplier_id,
    parentFulfillmentId: row.parent_fulfillment_id,
    status: row.status as FulfillmentStatus,
    supplierOrderReference: row.supplier_order_reference,
    submissionIdempotencyKey: row.submission_idempotency_key,
    manufacturingCostCents: row.manufacturing_cost_cents,
    supplierShippingCostCents: row.supplier_shipping_cost_cents,
    supplierPaymentStatus: row.supplier_payment_status as SupplierPaymentStatus,
    destinationCountryCode: row.destination_country_code,
    customerSnapshot: (row.customer_snapshot ?? {}) as SupplierCustomerSnapshot,
    productionPersonalization: (row.production_personalization ?? {}) as Record<string, unknown>,
    rejectionReason: row.rejection_reason,
    remakeReason: row.remake_reason,
    submittedAt: row.submitted_at,
    acceptedAt: row.accepted_at,
    productionStartedAt: row.production_started_at,
    shippedAt: row.shipped_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFulfillmentItem(row: FulfillmentItemRow): FulfillmentItem {
  return {
    id: row.id,
    fulfillmentId: row.fulfillment_id,
    orderItemId: row.order_item_id,
    supplierProductId: row.supplier_product_id,
    artworkStoragePath: row.artwork_storage_path,
    productionNotes: row.production_notes,
    personalizationRecord: (row.personalization_record ?? {}) as
      | ProductionPersonalizationRecord
      | Record<string, unknown>,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapShipment(row: ShipmentRow): Shipment {
  return {
    id: row.id,
    fulfillmentId: row.fulfillment_id,
    carrier: row.carrier,
    service: row.service,
    trackingNumber: row.tracking_number,
    trackingUrl: row.tracking_url,
    shippedAt: row.shipped_at,
    estimatedDeliveryAt: row.estimated_delivery_at,
    deliveredAt: row.delivered_at,
    status: row.status as ShipmentStatus,
    trackingEmailSentAt: row.tracking_email_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toJson(value: unknown): Json {
  return value as Json;
}
