import "server-only";

import { cookies } from "next/headers";

export const SELECTED_SHIPPING_QUOTE_COOKIE = "lc_shipping_quote_id";

export async function readSelectedShippingQuoteId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SELECTED_SHIPPING_QUOTE_COOKIE)?.value ?? null;
}

export async function writeSelectedShippingQuoteId(quoteId: string): Promise<void> {
  const store = await cookies();
  store.set(SELECTED_SHIPPING_QUOTE_COOKIE, quoteId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function clearSelectedShippingQuoteId(): Promise<void> {
  const store = await cookies();
  store.delete(SELECTED_SHIPPING_QUOTE_COOKIE);
}
