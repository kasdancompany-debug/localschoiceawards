import { z } from "zod";

export const addToCartSchema = z.object({
  productVariantId: z.string().uuid(),
  awardEligibilityId: z.string().uuid().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(50),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(50),
});

export const shippingDestinationSchema = z.object({
  countryCode: z.enum(["CA", "US"]),
  postalCode: z.string().trim().min(3).max(12),
  administrativeRegionCode: z.string().trim().max(10).optional().or(z.literal("")),
});

export const selectShippingQuoteSchema = z.object({
  quoteId: z.string().uuid(),
});
