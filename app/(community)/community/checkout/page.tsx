import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutClient } from "@/components/orders/checkout-client";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { getCurrentCommunity } from "@/lib/communities/current";
import { usesPathCommunityUrls } from "@/lib/communities/path-mode";
import { loadCheckoutPreview } from "@/lib/orders/checkout";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Pay for awards securely with Stripe Checkout — no password required.",
};

export default async function CommunityCheckoutPage() {
  const community = await getCurrentCommunity();
  const session = await getAuthenticatedSession();
  const preview = await loadCheckoutPreview(session?.userId ?? null);

  if (!preview.ok) {
    redirect(toRoute("/cart"));
  }

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow={community?.name ?? "Secure payment"}
          title="Checkout"
          description="Enter your email for the receipt, confirm shipping, and pay with Stripe. No account password required."
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
        returnPathPrefix={
          community && usesPathCommunityUrls() ? `/c/${community.subdomain}` : ""
        }
      />
    </PageShell>
  );
}
