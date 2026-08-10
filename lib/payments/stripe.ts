import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env/server";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function constructStripeEvent(payload: string | Buffer, signature: string) {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
}
