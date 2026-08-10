import "server-only";

import { sendCustomerTrackingEmail, sendSupplierOrderEmail } from "@/lib/email/fulfillment";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { storeProtectedArtwork } from "@/lib/fulfillment/artwork";
import {
  mapFulfillment,
  mapFulfillmentItem,
  mapShipment,
  mapSupplier,
  mapSupplierProduct,
  toJson,
} from "@/lib/fulfillment/mappers";
import {
  assertOrderPaidForFulfillment,
  buildProductionPersonalization,
  buildSubmissionIdempotencyKey,
  buildSupplierCustomerSnapshot,
  calculateGrossMargin,
  canSubmitFulfillment,
  destinationCountryFromAddress,
  nextStatusAfterAccept,
  selectSupplierForOrder,
  type SupplierRouteCandidate,
} from "@/lib/fulfillment/rules";
import type {
  Fulfillment,
  FulfillmentItem,
  FulfillmentStatus,
  OrderMarginReport,
  Shipment,
  Supplier,
} from "@/types/fulfillment";

async function writeAudit(input: {
  fulfillmentId?: string | null;
  supplierId?: string | null;
  orderId?: string | null;
  actorUserId?: string | null;
  action: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  await admin.from("fulfillment_audit_log").insert({
    fulfillment_id: input.fulfillmentId ?? null,
    supplier_id: input.supplierId ?? null,
    order_id: input.orderId ?? null,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    summary: input.summary,
    before_state: toJson(input.before ?? {}),
    after_state: toJson(input.after ?? {}),
  });
}

export async function listActiveSuppliers(): Promise<Supplier[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("suppliers").select("*").eq("active", true).order("name");
  return (data ?? []).map(mapSupplier);
}

export async function listAllSuppliers(): Promise<Supplier[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("suppliers").select("*").order("name");
  return (data ?? []).map(mapSupplier);
}

async function buildRouteCandidates(input: {
  destinationCountry: "CA" | "US";
  variantIds: string[];
}): Promise<SupplierRouteCandidate[]> {
  const admin = createSupabaseAdminClient();
  const { data: suppliers } = await admin.from("suppliers").select("*").eq("active", true);
  const candidates: SupplierRouteCandidate[] = [];

  for (const supplierRow of suppliers ?? []) {
    const supplier = mapSupplier(supplierRow);
    const { data: products } = await admin
      .from("supplier_products")
      .select("*")
      .eq("supplier_id", supplier.id)
      .eq("active", true)
      .in("product_variant_id", input.variantIds);

    const mapped = (products ?? []).map(mapSupplierProduct);
    const coversAllVariants = input.variantIds.every((variantId) =>
      mapped.some((product) => product.productVariantId === variantId),
    );

    const { data: rates } = await admin
      .from("supplier_shipping_rates")
      .select("*, shipping_zones(country_code)")
      .eq("supplier_id", supplier.id)
      .eq("active", true);

    const matchingRate = (rates ?? []).find((rate) => {
      const zone = rate.shipping_zones as { country_code?: string } | null;
      return zone?.country_code === input.destinationCountry;
    });

    candidates.push({
      supplierId: supplier.id,
      supplierName: supplier.name,
      countryCode: supplier.countryCode,
      currencyCode: supplier.currencyCode,
      active: supplier.active,
      fulfillmentMethod: supplier.fulfillmentMethod,
      manufacturingCostCents: mapped.reduce(
        (sum, product) => sum + product.manufacturingCostCents + product.setupCostCents,
        0,
      ),
      setupCostCents: mapped.reduce((sum, product) => sum + product.setupCostCents, 0),
      supplierShippingCostCents: matchingRate?.supplier_cost_cents ?? 0,
      coversAllVariants,
    });
  }

  return candidates;
}

export async function createFulfillmentsForPaidOrder(input: {
  orderId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true; fulfillmentId: string } | { ok: false; message: string; duplicate?: boolean }> {
  const admin = createSupabaseAdminClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", input.orderId).maybeSingle();
  if (!order) {
    return { ok: false, message: "Order not found." };
  }
  if (!assertOrderPaidForFulfillment(order.payment_status)) {
    return { ok: false, message: "Cannot submit an unpaid order for fulfillment." };
  }

  const { data: existing } = await admin
    .from("fulfillments")
    .select("status")
    .eq("order_id", order.id)
    .is("parent_fulfillment_id", null);
  const submitGuard = canSubmitFulfillment({
    existingStatuses: (existing ?? []).map((row) => row.status as FulfillmentStatus),
  });
  if (!submitGuard.ok) {
    return {
      ok: false,
      message: "Production order already exists for this customer order.",
      duplicate: true,
    };
  }

  const { data: items } = await admin.from("order_items").select("*").eq("order_id", order.id);
  if (!items?.length) {
    return { ok: false, message: "Order has no items." };
  }

  const destinationCountry =
    destinationCountryFromAddress(
      (order.shipping_address_snapshot ?? {}) as Record<string, unknown>,
    ) ?? (order.currency_code === "USD" ? "US" : "CA");

  const variantIds = items.map((item) => item.product_variant_id);
  const candidates = await buildRouteCandidates({
    destinationCountry,
    variantIds,
  });
  const selected = selectSupplierForOrder({
    destinationCountry,
    candidates,
  });
  if (!selected) {
    await writeAudit({
      orderId: order.id,
      action: "routing_failed",
      summary: "No active supplier covers this paid order.",
      actorUserId: input.actorUserId ?? null,
    });
    return { ok: false, message: "No supplier available for this destination and products." };
  }

  const idempotencyKey = buildSubmissionIdempotencyKey({
    orderId: order.id,
    supplierId: selected.supplierId,
  });

  const { data: existingByKey } = await admin
    .from("fulfillments")
    .select("*")
    .eq("submission_idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingByKey) {
    return { ok: true, fulfillmentId: existingByKey.id };
  }

  const customerSnapshot = buildSupplierCustomerSnapshot({
    shippingAddress: (order.shipping_address_snapshot ?? {}) as Record<string, unknown>,
    customerEmail: order.customer_email,
  });

  const supplierOrderReference = `${order.order_number}-${selected.supplierId.slice(0, 8)}`;

  const { data: fulfillmentRow, error: fulfillmentError } = await admin
    .from("fulfillments")
    .insert({
      order_id: order.id,
      supplier_id: selected.supplierId,
      status: "pending_submission",
      supplier_order_reference: supplierOrderReference,
      submission_idempotency_key: idempotencyKey,
      manufacturing_cost_cents: selected.manufacturingCostCents,
      supplier_shipping_cost_cents: selected.supplierShippingCostCents,
      supplier_payment_status: "unpaid",
      destination_country_code: destinationCountry,
      customer_snapshot: toJson(customerSnapshot),
      production_personalization: toJson({}),
    })
    .select("*")
    .maybeSingle();

  if (fulfillmentError || !fulfillmentRow) {
    if (fulfillmentError?.code === "23505") {
      const { data: raced } = await admin
        .from("fulfillments")
        .select("id")
        .eq("submission_idempotency_key", idempotencyKey)
        .maybeSingle();
      if (raced) {
        return { ok: true, fulfillmentId: raced.id };
      }
      return { ok: false, message: "Duplicate production order prevented.", duplicate: true };
    }
    return { ok: false, message: fulfillmentError?.message ?? "Unable to create fulfillment." };
  }

  const personalizationBundle: Record<string, unknown> = {};

  for (const item of items) {
    const { data: supplierProduct } = await admin
      .from("supplier_products")
      .select("*")
      .eq("supplier_id", selected.supplierId)
      .eq("product_variant_id", item.product_variant_id)
      .eq("active", true)
      .maybeSingle();
    if (!supplierProduct) {
      await admin
        .from("fulfillments")
        .update({ status: "submission_failed" })
        .eq("id", fulfillmentRow.id);
      return { ok: false, message: "Supplier product mapping missing for an order item." };
    }

    const record = buildProductionPersonalization({
      orderNumber: order.order_number,
      orderItemId: item.id,
      productName: item.product_name_snapshot,
      variantName: item.variant_name_snapshot,
      sku: item.sku_snapshot,
      quantity: item.quantity,
      snapshot: (item.personalization_snapshot ?? {}) as Record<string, unknown>,
    });
    personalizationBundle[item.id] = record;

    const { data: fulfillmentItem, error: itemError } = await admin
      .from("fulfillment_items")
      .insert({
        fulfillment_id: fulfillmentRow.id,
        order_item_id: item.id,
        supplier_product_id: supplierProduct.id,
        personalization_record: toJson(record),
        production_notes: record.artworkInstructions,
        status: "pending",
      })
      .select("*")
      .maybeSingle();

    if (itemError || !fulfillmentItem) {
      await admin
        .from("fulfillments")
        .update({ status: "submission_failed" })
        .eq("id", fulfillmentRow.id);
      return { ok: false, message: "Unable to create fulfillment items." };
    }

    try {
      const artworkPath = await storeProtectedArtwork({
        fulfillmentId: fulfillmentRow.id,
        fulfillmentItemId: fulfillmentItem.id,
        record,
      });
      await admin
        .from("fulfillment_items")
        .update({ artwork_storage_path: artworkPath, status: "artwork_ready" })
        .eq("id", fulfillmentItem.id);
    } catch {
      await admin
        .from("fulfillments")
        .update({ status: "submission_failed" })
        .eq("id", fulfillmentRow.id);
      await writeAudit({
        fulfillmentId: fulfillmentRow.id,
        supplierId: selected.supplierId,
        orderId: order.id,
        action: "artwork_failed",
        summary: "Protected artwork generation failed.",
        actorUserId: input.actorUserId ?? null,
      });
      return { ok: false, message: "Unable to generate protected artwork." };
    }
  }

  const { data: supplier } = await admin
    .from("suppliers")
    .select("*")
    .eq("id", selected.supplierId)
    .maybeSingle();

  const now = new Date().toISOString();
  await admin
    .from("fulfillments")
    .update({
      status: "submitted",
      submitted_at: now,
      production_personalization: toJson(personalizationBundle),
    })
    .eq("id", fulfillmentRow.id);

  await admin
    .from("orders")
    .update({ fulfillment_status: "in_progress" })
    .eq("id", order.id);

  if (supplier && (supplier.fulfillment_method === "email" || supplier.fulfillment_method === "portal")) {
    await sendSupplierOrderEmail({
      to: supplier.contact_email,
      supplierName: supplier.name,
      orderReference: supplierOrderReference,
      method: supplier.fulfillment_method,
      fulfillmentId: fulfillmentRow.id,
      itemSummaries: items.map(
        (item) =>
          `${item.quantity}× ${item.product_name_snapshot} (${item.sku_snapshot})`,
      ),
    });
  }

  // Future API support is intentionally not implemented yet.
  await writeAudit({
    fulfillmentId: fulfillmentRow.id,
    supplierId: selected.supplierId,
    orderId: order.id,
    action: "submitted",
    summary: `Submitted to ${selected.supplierName} via ${selected.fulfillmentMethod}.`,
    actorUserId: input.actorUserId ?? null,
    after: { status: "submitted", supplierOrderReference },
  });

  return { ok: true, fulfillmentId: fulfillmentRow.id };
}

export async function listFulfillmentsForSupplier(input: {
  supplierId: string;
  statuses?: FulfillmentStatus[];
}): Promise<Fulfillment[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("fulfillments")
    .select("*")
    .eq("supplier_id", input.supplierId)
    .order("created_at", { ascending: false });
  if (input.statuses?.length) {
    query = query.in("status", input.statuses);
  }
  const { data } = await query;
  return (data ?? []).map(mapFulfillment);
}

export async function listFulfillmentsForAdmin(input?: {
  status?: FulfillmentStatus;
  failedOnly?: boolean;
}): Promise<Fulfillment[]> {
  const admin = createSupabaseAdminClient();
  let query = admin.from("fulfillments").select("*").order("created_at", { ascending: false });
  if (input?.failedOnly) {
    query = query.eq("status", "submission_failed");
  } else if (input?.status) {
    query = query.eq("status", input.status);
  }
  const { data } = await query.limit(200);
  return (data ?? []).map(mapFulfillment);
}

export async function getFulfillmentDetail(fulfillmentId: string): Promise<{
  fulfillment: Fulfillment;
  items: FulfillmentItem[];
  shipments: Shipment[];
  supplier: Supplier | null;
  orderNumber: string | null;
} | null> {
  const admin = createSupabaseAdminClient();
  const { data: fulfillment } = await admin
    .from("fulfillments")
    .select("*")
    .eq("id", fulfillmentId)
    .maybeSingle();
  if (!fulfillment) {
    return null;
  }
  const [{ data: items }, { data: shipments }, { data: supplier }, { data: order }] =
    await Promise.all([
      admin.from("fulfillment_items").select("*").eq("fulfillment_id", fulfillmentId),
      admin.from("shipments").select("*").eq("fulfillment_id", fulfillmentId).order("created_at", { ascending: false }),
      admin.from("suppliers").select("*").eq("id", fulfillment.supplier_id).maybeSingle(),
      admin.from("orders").select("order_number").eq("id", fulfillment.order_id).maybeSingle(),
    ]);

  return {
    fulfillment: mapFulfillment(fulfillment),
    items: (items ?? []).map(mapFulfillmentItem),
    shipments: (shipments ?? []).map(mapShipment),
    supplier: supplier ? mapSupplier(supplier) : null,
    orderNumber: order?.order_number ?? null,
  };
}

export async function updateFulfillmentStatus(input: {
  fulfillmentId: string;
  action: "accept" | "reject" | "start_production" | "ready_to_ship" | "complete";
  reason?: string;
  actorUserId: string;
  supplierId: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data: fulfillment } = await admin
    .from("fulfillments")
    .select("*")
    .eq("id", input.fulfillmentId)
    .eq("supplier_id", input.supplierId)
    .maybeSingle();
  if (!fulfillment) {
    return { ok: false, message: "Fulfillment not found for this supplier." };
  }

  const before = { status: fulfillment.status };
  const now = new Date().toISOString();
  let nextStatus: FulfillmentStatus | null = null;
  const patch: {
    status?: FulfillmentStatus;
    accepted_at?: string;
    rejection_reason?: string;
    cancelled_at?: string;
    production_started_at?: string;
    completed_at?: string;
  } = {};

  switch (input.action) {
    case "accept":
      nextStatus = nextStatusAfterAccept(fulfillment.status as FulfillmentStatus);
      if (!nextStatus) {
        return { ok: false, message: "Only submitted/remake orders can be accepted." };
      }
      patch.accepted_at = now;
      break;
    case "reject":
      nextStatus = "rejected";
      patch.rejection_reason = input.reason ?? "";
      patch.cancelled_at = now;
      break;
    case "start_production":
      if (!["accepted", "remake_in_progress"].includes(fulfillment.status)) {
        return { ok: false, message: "Accept the order before production." };
      }
      nextStatus = fulfillment.status === "remake_in_progress" ? "remake_in_progress" : "in_production";
      patch.production_started_at = now;
      break;
    case "ready_to_ship":
      if (!["in_production", "remake_in_progress", "accepted"].includes(fulfillment.status)) {
        return { ok: false, message: "Order is not ready to mark ready-to-ship." };
      }
      nextStatus = "ready_to_ship";
      break;
    case "complete":
      nextStatus = "completed";
      patch.completed_at = now;
      break;
    default:
      return { ok: false, message: "Unknown action." };
  }

  patch.status = nextStatus;
  await admin.from("fulfillments").update(patch).eq("id", fulfillment.id);
  await writeAudit({
    fulfillmentId: fulfillment.id,
    supplierId: fulfillment.supplier_id,
    orderId: fulfillment.order_id,
    actorUserId: input.actorUserId,
    action: input.action,
    summary: `Status ${fulfillment.status} → ${nextStatus}`,
    before,
    after: { status: nextStatus, reason: input.reason ?? null },
  });
  return { ok: true, message: `Marked ${nextStatus}.` };
}

export async function addShipmentTracking(input: {
  fulfillmentId: string;
  supplierId: string;
  actorUserId: string;
  carrier: string;
  service?: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDeliveryAt?: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createSupabaseAdminClient();
  const detail = await getFulfillmentDetail(input.fulfillmentId);
  if (!detail || detail.fulfillment.supplierId !== input.supplierId) {
    return { ok: false, message: "Fulfillment not found for this supplier." };
  }

  const now = new Date().toISOString();
  const { data: shipment, error } = await admin
    .from("shipments")
    .insert({
      fulfillment_id: input.fulfillmentId,
      carrier: input.carrier,
      service: input.service ?? "",
      tracking_number: input.trackingNumber,
      tracking_url: input.trackingUrl ?? "",
      shipped_at: now,
      estimated_delivery_at: input.estimatedDeliveryAt || null,
      status: "shipped",
    })
    .select("*")
    .maybeSingle();

  if (error || !shipment) {
    return { ok: false, message: "Unable to save shipment." };
  }

  await admin
    .from("fulfillments")
    .update({ status: "shipped", shipped_at: now })
    .eq("id", input.fulfillmentId);

  await admin
    .from("orders")
    .update({ fulfillment_status: "shipped" })
    .eq("id", detail.fulfillment.orderId);

  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, customer_email, user_id")
    .eq("id", detail.fulfillment.orderId)
    .maybeSingle();

  if (order?.customer_email) {
    await sendCustomerTrackingEmail({
      to: order.customer_email,
      orderNumber: order.order_number,
      orderId: order.id,
      userId: order.user_id,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      trackingUrl: input.trackingUrl,
    });
    await admin
      .from("shipments")
      .update({ tracking_email_sent_at: new Date().toISOString() })
      .eq("id", shipment.id);
  }

  await writeAudit({
    fulfillmentId: input.fulfillmentId,
    supplierId: input.supplierId,
    orderId: detail.fulfillment.orderId,
    actorUserId: input.actorUserId,
    action: "shipped",
    summary: `Shipped via ${input.carrier} ${input.trackingNumber}`,
  });

  return { ok: true, message: "Shipment recorded and tracking emailed." };
}

export async function requestRemake(input: {
  fulfillmentId: string;
  reason: string;
  actorUserId: string;
}): Promise<{ ok: true; fulfillmentId: string } | { ok: false; message: string }> {
  const admin = createSupabaseAdminClient();
  const { data: parent } = await admin
    .from("fulfillments")
    .select("*")
    .eq("id", input.fulfillmentId)
    .maybeSingle();
  if (!parent) {
    return { ok: false, message: "Fulfillment not found." };
  }

  const { data: order } = await admin.from("orders").select("*").eq("id", parent.order_id).maybeSingle();
  if (!order || !assertOrderPaidForFulfillment(order.payment_status)) {
    return { ok: false, message: "Remakes require a paid order." };
  }

  const idempotencyKey = buildSubmissionIdempotencyKey({
    orderId: parent.order_id,
    supplierId: parent.supplier_id,
    parentFulfillmentId: parent.id,
  });

  const { data: existing } = await admin
    .from("fulfillments")
    .select("id")
    .eq("submission_idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) {
    return { ok: true, fulfillmentId: existing.id };
  }

  const remakeRef = `${parent.supplier_order_reference}-R${Date.now().toString(36).slice(-4)}`;
  const { data: remake, error } = await admin
    .from("fulfillments")
    .insert({
      order_id: parent.order_id,
      supplier_id: parent.supplier_id,
      parent_fulfillment_id: parent.id,
      status: "remake_requested",
      supplier_order_reference: remakeRef,
      submission_idempotency_key: idempotencyKey,
      manufacturing_cost_cents: parent.manufacturing_cost_cents,
      supplier_shipping_cost_cents: parent.supplier_shipping_cost_cents,
      supplier_payment_status: "unpaid",
      destination_country_code: parent.destination_country_code,
      customer_snapshot: parent.customer_snapshot,
      production_personalization: parent.production_personalization,
      remake_reason: input.reason,
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (error || !remake) {
    return { ok: false, message: error?.message ?? "Unable to create remake." };
  }

  const { data: parentItems } = await admin
    .from("fulfillment_items")
    .select("*")
    .eq("fulfillment_id", parent.id);

  for (const item of parentItems ?? []) {
    await admin.from("fulfillment_items").insert({
      fulfillment_id: remake.id,
      order_item_id: item.order_item_id,
      supplier_product_id: item.supplier_product_id,
      artwork_storage_path: item.artwork_storage_path,
      production_notes: item.production_notes,
      personalization_record: item.personalization_record,
      status: "remake",
    });
  }

  await writeAudit({
    fulfillmentId: remake.id,
    supplierId: parent.supplier_id,
    orderId: parent.order_id,
    actorUserId: input.actorUserId,
    action: "remake_requested",
    summary: input.reason,
  });

  return { ok: true, fulfillmentId: remake.id };
}

export async function getSupplierIdsForUser(userId: string): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("supplier_users")
    .select("supplier_id")
    .eq("user_id", userId)
    .eq("status", "active");
  return (data ?? []).map((row) => row.supplier_id);
}

export async function listSupplierTeam(supplierId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("supplier_users")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("created_at");
  return data ?? [];
}

export async function listSupplierProducts(supplierId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("supplier_products").select("*").order("supplier_sku");
  if (supplierId) {
    query = query.eq("supplier_id", supplierId);
  }
  const { data } = await query;
  return (data ?? []).map(mapSupplierProduct);
}

export async function listSupplierShippingRates(supplierId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("supplier_shipping_rates").select("*").order("shipping_method_name");
  if (supplierId) {
    query = query.eq("supplier_id", supplierId);
  }
  const { data } = await query;
  return data ?? [];
}

export async function listSupplierInvoices(supplierId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("supplier_invoices").select("*").order("created_at", { ascending: false });
  if (supplierId) {
    query = query.eq("supplier_id", supplierId);
  }
  const { data } = await query;
  return data ?? [];
}

export async function buildMarginReports(limit = 100): Promise<OrderMarginReport[]> {
  const admin = createSupabaseAdminClient();
  const { data: fulfillments } = await admin
    .from("fulfillments")
    .select("*")
    .is("parent_fulfillment_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  const reports: OrderMarginReport[] = [];
  for (const row of fulfillments ?? []) {
    const { data: order } = await admin
      .from("orders")
      .select("order_number, currency_code, subtotal_cents, shipping_cents")
      .eq("id", row.order_id)
      .maybeSingle();
    if (!order) continue;
    const margin = calculateGrossMargin({
      customerMerchandiseCents: order.subtotal_cents,
      customerShippingCents: order.shipping_cents,
      manufacturingCostCents: row.manufacturing_cost_cents,
      supplierShippingCostCents: row.supplier_shipping_cost_cents,
    });
    reports.push({
      orderId: row.order_id,
      orderNumber: order.order_number,
      currencyCode: order.currency_code,
      customerMerchandiseCents: order.subtotal_cents,
      customerShippingCents: order.shipping_cents,
      customerRevenueCents: margin.customerRevenueCents,
      manufacturingCostCents: row.manufacturing_cost_cents,
      supplierShippingCostCents: row.supplier_shipping_cost_cents,
      supplierCostCents: margin.supplierCostCents,
      grossMarginCents: margin.grossMarginCents,
      grossMarginPercent: margin.grossMarginPercent,
    });
  }
  return reports;
}

export async function getSupplierPerformance() {
  const admin = createSupabaseAdminClient();
  const { data: suppliers } = await admin.from("suppliers").select("*").order("name");
  const rows = [];
  for (const supplier of suppliers ?? []) {
    const { data: fulfillments } = await admin
      .from("fulfillments")
      .select("status, shipped_at, submitted_at, created_at")
      .eq("supplier_id", supplier.id);
    const total = fulfillments?.length ?? 0;
    const shipped = (fulfillments ?? []).filter((row) =>
      ["shipped", "completed"].includes(row.status),
    ).length;
    const rejected = (fulfillments ?? []).filter((row) => row.status === "rejected").length;
    const failed = (fulfillments ?? []).filter((row) => row.status === "submission_failed").length;
    rows.push({
      supplier: mapSupplier(supplier),
      total,
      shipped,
      rejected,
      failed,
      shipRate: total ? shipped / total : 0,
    });
  }
  return rows;
}
