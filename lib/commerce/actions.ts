"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  addItemToCart,
  listCartLines,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/commerce/cart";
import {
  listShippingOptionsForDestination,
  selectShippingQuote,
} from "@/lib/commerce/shipping";
import {
  addToCartSchema,
  selectShippingQuoteSchema,
  shippingDestinationSchema,
  updateCartItemSchema,
} from "@/lib/validation/commerce";

function revalidateCommercePaths() {
  revalidatePath("/cart");
  revalidatePath("/awards");
}

export type CommerceActionState = {
  ok: boolean;
  message?: string;
};

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function addToCartAction(
  _prev: CommerceActionState,
  formData: FormData,
): Promise<CommerceActionState> {
  const session = await getAuthenticatedSession();
  const parsed = addToCartSchema.safeParse({
    productVariantId: formData.get("productVariantId"),
    awardEligibilityId: formData.get("awardEligibilityId") || "",
    quantity: formData.get("quantity") || "1",
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await addItemToCart({
    userId: session?.userId ?? null,
    productVariantId: parsed.data.productVariantId,
    awardEligibilityId: parsed.data.awardEligibilityId || null,
    quantity: parsed.data.quantity,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  revalidateCommercePaths();
  return { ok: true, message: "Added to cart." };
}

export async function updateCartItemAction(
  _prev: CommerceActionState,
  formData: FormData,
): Promise<CommerceActionState> {
  const session = await getAuthenticatedSession();
  const parsed = updateCartItemSchema.safeParse({
    cartItemId: formData.get("cartItemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await updateCartItemQuantity({
    userId: session?.userId ?? null,
    cartItemId: parsed.data.cartItemId,
    quantity: parsed.data.quantity,
  });
  if (result.ok) {
    revalidateCommercePaths();
  }
  return result;
}

export async function removeCartItemAction(
  _prev: CommerceActionState,
  formData: FormData,
): Promise<CommerceActionState> {
  const session = await getAuthenticatedSession();
  const cartItemId = String(formData.get("cartItemId") ?? "");
  if (!cartItemId) {
    return { ok: false, message: "Missing cart item." };
  }
  await removeCartItem({ userId: session?.userId ?? null, cartItemId });
  revalidateCommercePaths();
  return { ok: true, message: "Removed." };
}

export async function quoteShippingAction(
  _prev: CommerceActionState & {
    methods?: Array<{
      quoteId: string;
      name: string;
      description: string;
      shippingCents: number;
      estimatedMinDays: number;
      estimatedMaxDays: number;
      currencyCode: string;
    }>;
  },
  formData: FormData,
): Promise<
  CommerceActionState & {
    methods?: Array<{
      quoteId: string;
      name: string;
      description: string;
      shippingCents: number;
      estimatedMinDays: number;
      estimatedMaxDays: number;
      currencyCode: string;
    }>;
  }
> {
  const session = await getAuthenticatedSession();
  const parsed = shippingDestinationSchema.safeParse({
    countryCode: formData.get("countryCode"),
    postalCode: formData.get("postalCode"),
    administrativeRegionCode: formData.get("administrativeRegionCode") || "",
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await listShippingOptionsForDestination({
    userId: session?.userId ?? null,
    destination: {
      countryCode: parsed.data.countryCode,
      postalCode: parsed.data.postalCode,
      administrativeRegionCode: parsed.data.administrativeRegionCode || undefined,
    },
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return {
    ok: true,
    message: result.methods.length
      ? "Shipping estimates ready."
      : "No shipping required for digital-only carts.",
    methods: result.methods.map((method) => ({
      quoteId: method.quoteId,
      name: method.name,
      description: method.description,
      shippingCents: method.shippingCents,
      estimatedMinDays: method.estimatedMinDays,
      estimatedMaxDays: method.estimatedMaxDays,
      currencyCode: method.currencyCode,
    })),
  };
}

export async function selectShippingQuoteAction(
  _prev: CommerceActionState,
  formData: FormData,
): Promise<CommerceActionState> {
  const session = await getAuthenticatedSession();
  const parsed = selectShippingQuoteSchema.safeParse({
    quoteId: formData.get("quoteId"),
  });
  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const result = await selectShippingQuote({
    userId: session?.userId ?? null,
    quoteId: parsed.data.quoteId,
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  revalidateCommercePaths();
  return { ok: true, message: "Shipping method selected." };
}

export async function getCartSummaryAction() {
  const session = await getAuthenticatedSession();
  return listCartLines({ userId: session?.userId ?? null });
}
