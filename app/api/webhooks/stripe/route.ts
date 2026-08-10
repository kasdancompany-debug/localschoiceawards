import { NextResponse } from "next/server";

import { constructStripeEvent } from "@/lib/payments/stripe";
import { processStripeWebhookEvent } from "@/lib/orders/webhooks";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = constructStripeEvent(payload, signature);
    const result = await processStripeWebhookEvent({ event, payload });

    if (!result.ok) {
      return NextResponse.json({ error: result.message ?? "Processing failed." }, { status: 500 });
    }

    return NextResponse.json({ received: true, duplicate: Boolean(result.duplicate) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
