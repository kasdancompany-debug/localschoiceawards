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
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review personalized award products, estimate shipping, and prepare for checkout.",
};

export default async function CartPage() {
  const session = await getAuthenticatedSession();
  const { cart, lines } = await listCartLines({ userId: session?.userId ?? null });
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
          eyebrow="Checkout prep"
          title="Cart"
          description="Persistent server-side cart. Enter a postal or ZIP code for shipping estimates, then review subtotal, shipping, estimated tax, and total."
        />
        <Link href={toRoute("/awards")} className={cn(buttonVariants({ variant: "outline" }))}>
          Add another product
        </Link>
      </div>
      <CartClient lines={lines} totals={totals} currency={cart.currencyCode} />
    </PageShell>
  );
}
