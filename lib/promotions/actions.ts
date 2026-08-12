"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthenticatedSession } from "@/lib/auth/session";
import { startBusinessPromoteCheckout } from "@/lib/promotions/service";
import { toRoute } from "@/lib/routes";
import { z } from "zod";
import type { CommerceCurrency } from "@/types/commerce";

export type PromoteActionState = {
  ok: boolean;
  message?: string;
};

const promoteSchema = z.object({
  businessId: z.string().uuid(),
  communityId: z.string().uuid(),
  businessName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().email().max(320),
  currencyCode: z.enum(["CAD", "USD"]),
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

export async function startPromoteCheckoutAction(
  _prev: PromoteActionState,
  formData: FormData,
): Promise<PromoteActionState> {
  const session = await getAuthenticatedSession();
  const parsed = promoteSchema.safeParse({
    businessId: formData.get("businessId"),
    communityId: formData.get("communityId"),
    businessName: formData.get("businessName"),
    customerEmail: formData.get("customerEmail") || session?.email || "",
    currencyCode: formData.get("currencyCode") || "CAD",
    returnPathPrefix: formData.get("returnPathPrefix") || "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Check the promotion form and try again.",
    };
  }

  const result = await startBusinessPromoteCheckout({
    businessId: parsed.data.businessId,
    communityId: parsed.data.communityId,
    businessName: parsed.data.businessName,
    customerEmail: parsed.data.customerEmail,
    currencyCode: parsed.data.currencyCode as CommerceCurrency,
    userId: session?.userId ?? null,
    returnBaseUrl: await requestReturnBaseUrl(parsed.data.returnPathPrefix || undefined),
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  redirect(toRoute(result.checkoutUrl));
}
