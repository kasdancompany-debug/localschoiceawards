import type { Metadata } from "next";
import Link from "next/link";

import { CartClient } from "@/components/commerce/cart-client";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { computeCartTotals, listCartLines } from "@/lib/commerce/cart";
import { estimateTaxCents } from "@/lib/commerce/rules";
import { getShippingQuoteForCart } from "@/lib/commerce/shipping";
import { readSelectedShippingQuoteId } from "@/lib/commerce/shipping-quote-cookie";
import { getCurrentCommunity } from "@/lib/communities/current";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review awards, estimate shipping, and continue to Stripe checkout.",
};

export default async function CommunityCartPage() {
  const community = await getCurrentCommunity();
  const session = await getAuthenticatedSession();
  let cartView: Awaited<ReturnType<typeof listCartLines>> | null = null;
  try {
    cartView = await listCartLines({ userId: session?.userId ?? null });
  } catch {
    cartView = null;
  }

  if (!cartView) {
    return (
      <PageShell>
        <PageIntro
          eyebrow={community?.name ?? "Checkout"}
          title="Cart"
          description="Your cart is temporarily unavailable. Please try again in a moment."
        />
        <Link href={toRoute("/order")} className={cn(buttonVariants({ variant: "outline" }))}>
          Search businesses
        </Link>
      </PageShell>
    );
  }

  const { cart, lines } = cartView;
  const selectedQuoteId = await readSelectedShippingQuoteId();
  const selected = await getShippingQuoteForCart({
    cartId: cart.id,
    quoteId: selectedQuoteId,
  });
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const shippingCents = selected?.quote.shippingCents ?? 0;
  const countryCode = selected?.countryCode ?? (cart.currencyCode === "USD" ? "US" : "CA");
  const estimatedTaxCents = estimateTaxCents({
    countryCode,
    subtotalCents: subtotal,
    shippingCents,
  });
  const totals = await computeCartTotals({
    cart,
    lines,
    selectedQuoteId: selected?.quote.id ?? null,
    shippingCents,
    shippingMethodName: selected?.methodName ?? null,
    estimatedTaxCents,
  });

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow={community?.name ?? "Checkout prep"}
          title="Cart"
          description="Add awards from any business listing, enter a postal or ZIP code for shipping, then continue to Stripe — no password required."
        />
        <Link href={toRoute("/order")} className={cn(buttonVariants({ variant: "outline" }))}>
          Add another business
        </Link>
      </div>
      <CartClient lines={lines} totals={totals} currency={cart.currencyCode} />
    </PageShell>
  );
}
