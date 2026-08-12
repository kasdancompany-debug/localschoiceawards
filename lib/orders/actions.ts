"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdminSession, getAuthenticatedSession } from "@/lib/auth/session";
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

const guestCheckoutSchema = z.object({
  customerEmail: z.string().trim().email().max(320),
  clientTotalCents: z.coerce.number().int().nonnegative().optional().nullable(),
  returnPathPrefix: z
    .string()
    .trim()
    .regex(/^(\/c\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/i)
    .optional()
    .or(z.literal("")),
});

async function requestReturnBaseUrl(pathPrefix?: string): Promise<string | undefined> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  if (!host) return undefined;
  const proto =
    headerStore.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const prefix = pathPrefix?.replace(/\/$/, "") ?? "";
  return `${proto}://${host}${prefix}`;
}

export async function startCheckoutAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const session = await getAuthenticatedSession();
  const parsed = guestCheckoutSchema.safeParse({
    customerEmail: formData.get("customerEmail") || session?.email || "",
    clientTotalCents: formData.get("clientTotalCents") || null,
    returnPathPrefix: formData.get("returnPathPrefix") || "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Enter a valid email to continue.",
    };
  }

  const result = await startStripeCheckout({
    userId: session?.userId ?? null,
    customerEmail: parsed.data.customerEmail,
    clientTotalCents: parsed.data.clientTotalCents ?? null,
    returnBaseUrl: await requestReturnBaseUrl(parsed.data.returnPathPrefix || undefined),
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  // Stripe Checkout is an absolute URL outside the typed app route map.
  redirect(toRoute(result.checkoutUrl));
}

export async function getCheckoutPreviewAction() {
  const session = await getAuthenticatedSession();
  return loadCheckoutPreview(session?.userId ?? null);
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
