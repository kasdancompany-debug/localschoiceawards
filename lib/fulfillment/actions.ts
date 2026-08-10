"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession, requireSupplierSession } from "@/lib/auth/session";
import {
  addShipmentTracking,
  getSupplierIdsForUser,
  requestRemake,
  updateFulfillmentStatus,
} from "@/lib/fulfillment/service";
import { z } from "zod";

export type FulfillmentActionState = { ok: boolean; message?: string };

async function assertSupplierOwns(fulfillmentSupplierId: string, userId: string) {
  const ids = await getSupplierIdsForUser(userId);
  return ids.includes(fulfillmentSupplierId);
}

export async function supplierFulfillmentAction(
  _prev: FulfillmentActionState,
  formData: FormData,
): Promise<FulfillmentActionState> {
  const session = await requireSupplierSession("/supplier");
  const action = String(formData.get("action") ?? "");
  const fulfillmentId = String(formData.get("fulfillmentId") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!(await assertSupplierOwns(supplierId, session.userId))) {
    return { ok: false, message: "Unauthorized for this supplier." };
  }

  if (
    action !== "accept" &&
    action !== "reject" &&
    action !== "start_production" &&
    action !== "ready_to_ship" &&
    action !== "complete"
  ) {
    return { ok: false, message: "Invalid action." };
  }

  const result = await updateFulfillmentStatus({
    fulfillmentId,
    supplierId,
    actorUserId: session.userId,
    action,
    reason,
  });
  revalidatePath("/supplier");
  revalidatePath(`/supplier/orders/${fulfillmentId}`);
  return result;
}

export async function supplierShipmentAction(
  _prev: FulfillmentActionState,
  formData: FormData,
): Promise<FulfillmentActionState> {
  const session = await requireSupplierSession("/supplier");
  const parsed = z
    .object({
      fulfillmentId: z.string().uuid(),
      supplierId: z.string().uuid(),
      carrier: z.string().trim().min(2).max(80),
      service: z.string().trim().max(80).optional(),
      trackingNumber: z.string().trim().min(4).max(120),
      trackingUrl: z.string().url().optional().or(z.literal("")),
    })
    .safeParse({
      fulfillmentId: formData.get("fulfillmentId"),
      supplierId: formData.get("supplierId"),
      carrier: formData.get("carrier"),
      service: formData.get("service") || "",
      trackingNumber: formData.get("trackingNumber"),
      trackingUrl: formData.get("trackingUrl") || "",
    });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid shipment." };
  }
  if (!(await assertSupplierOwns(parsed.data.supplierId, session.userId))) {
    return { ok: false, message: "Unauthorized for this supplier." };
  }

  const result = await addShipmentTracking({
    ...parsed.data,
    trackingUrl: parsed.data.trackingUrl || undefined,
    actorUserId: session.userId,
  });
  revalidatePath("/supplier");
  revalidatePath(`/supplier/orders/${parsed.data.fulfillmentId}`);
  return result;
}

export async function adminRemakeAction(
  _prev: FulfillmentActionState,
  formData: FormData,
): Promise<FulfillmentActionState> {
  const session = await requireAdminSession("/admin/fulfillment");
  const fulfillmentId = String(formData.get("fulfillmentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!fulfillmentId || reason.length < 3) {
    return { ok: false, message: "Remake reason is required." };
  }
  const result = await requestRemake({
    fulfillmentId,
    reason,
    actorUserId: session.userId,
  });
  if (!result.ok) {
    return result;
  }
  revalidatePath("/admin/fulfillment");
  revalidatePath("/admin/remakes");
  return { ok: true, message: "Remake queued." };
}
