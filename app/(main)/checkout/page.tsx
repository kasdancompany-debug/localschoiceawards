import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutClient } from "@/components/orders/checkout-client";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { loadCheckoutPreview } from "@/lib/orders/checkout";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review merchandise and shipping, then pay securely with Stripe Checkout.",
};

export default async function CheckoutPage() {
  const session = await getAuthenticatedSession();
  const preview = await loadCheckoutPreview(session?.userId ?? null);

  if (!preview.ok) {
    redirect(toRoute("/cart"));
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow="Secure payment"
          title="Checkout"
          description="No account required — enter your email, confirm shipping, and pay with Stripe. Payment is confirmed only after a verified webhook."
        />
        <Link href={toRoute("/cart")} className={cn(buttonVariants({ variant: "outline" }))}>
          Edit cart
        </Link>
      </div>
      <CheckoutClient
        preview={preview.orderPreview}
        canCheckout={preview.orderPreview.shippingReady}
        blockedReason={preview.orderPreview.shippingBlockedReason ?? undefined}
        customerEmail={session?.email ?? ""}
        requireEmail={!session}
      />
    </PageShell>
  );
}
