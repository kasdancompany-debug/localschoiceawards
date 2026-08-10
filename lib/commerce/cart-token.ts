import "server-only";

import { cookies } from "next/headers";

import { createCartToken, hashCartToken } from "@/lib/commerce/cart-token-crypto";

export { createCartToken, hashCartToken };

export const CART_TOKEN_COOKIE = "lc_cart_token";
const CART_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function readCartTokenFromCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_TOKEN_COOKIE)?.value ?? null;
}

export async function writeCartTokenCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(CART_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TOKEN_MAX_AGE_SECONDS,
  });
}

export async function clearCartTokenCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CART_TOKEN_COOKIE);
}
