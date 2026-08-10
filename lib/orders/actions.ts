"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdminSession, requireUser } from "@/lib/auth/session";
import { loadCheckoutPreview, startStripeCheckout } from "@/lib/orders/checkout";
import { createAdminRefund, updateOrderFraudFlags } from "@/lib/orders/refunds";
import { ORDER_FRAUD_FLAG_OPTIONS, type OrderFraudFlag } from "@/lib/orders/rules";
import { toRoute } from "@/lib/routes";
import { z } from "zod";

export type OrderActionState = {
  ok: boolean;
  message?: string;
  checkoutUrl?: string;
};

const refundSchema = z.object({
  orderId: z.string().uuid(),
  amountCents: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
});

const fraudSchema = z.object({
  orderId: z.string().uuid(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  flags: z.array(z.enum(ORDER_FRAUD_FLAG_OPTIONS)).default([]),
});

export async function startCheckoutAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const session = await requireUser({ next: "/checkout" });
  const clientTotalRaw = formData.get("clientTotalCents");
  const clientTotalCents =
    typeof clientTotalRaw === "string" && clientTotalRaw.length
      ? Number(clientTotalRaw)
      : null;

  const result = await startStripeCheckout({
    userId: session.userId,
    customerEmail: session.email,
    clientTotalCents: Number.isFinite(clientTotalCents) ? clientTotalCents : null,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  // Stripe Checkout is an absolute URL outside the typed app route map.
  redirect(toRoute(result.checkoutUrl));
}

export async function getCheckoutPreviewAction() {
  const session = await requireUser({ next: "/checkout" });
  return loadCheckoutPreview(session.userId);
}

export async function adminRefundAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const session = await requireAdminSession("/admin/orders");
  const parsed = refundSchema.safeParse({
    orderId: formData.get("orderId"),
    amountCents: formData.get("amountCents"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid refund." };
  }

  const result = await createAdminRefund({
    ...parsed.data,
    requestedBy: session.userId,
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: "Refund submitted." };
}

export async function adminFraudFlagsAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requireAdminSession("/admin/orders");
  const flags = formData.getAll("flags").map(String) as OrderFraudFlag[];
  const parsed = fraudSchema.safeParse({
    orderId: formData.get("orderId"),
    notes: formData.get("notes") || "",
    flags,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid fraud flags." };
  }

  const result = await updateOrderFraudFlags({
    orderId: parsed.data.orderId,
    flags: parsed.data.flags,
    notes: parsed.data.notes || "",
  });
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  return result;
}
