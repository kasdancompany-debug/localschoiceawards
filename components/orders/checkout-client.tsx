"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { startCheckoutAction, type OrderActionState } from "@/lib/orders/actions";
import { formatMoney } from "@/lib/commerce/rules";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CommerceCurrency } from "@/types/commerce";

const initial: OrderActionState = { ok: false };

type CheckoutClientProps = {
  preview: {
    currencyCode: string;
    subtotalCents: number;
    shippingCents: number;
    estimatedTaxNote: string;
    totalBeforeTaxCents: number;
    requiresShipping: boolean;
    shippingReady: boolean;
    shippingMethodName: string | null;
    shippingBlockedReason: string | null;
    lines: Array<{
      productName: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
    }>;
  };
  canCheckout: boolean;
  blockedReason?: string;
};

export function CheckoutClient({ preview, canCheckout, blockedReason }: CheckoutClientProps) {
  const [state, action, pending] = useActionState(startCheckoutAction, initial);
  const currency = preview.currencyCode as CommerceCurrency;

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold">Order review</h2>
        {preview.lines.map((line, index) => (
          <div
            key={`${line.productName}-${index}`}
            className="flex justify-between gap-4 border-b border-border/70 pb-3 text-sm"
          >
            <div>
              <p className="font-medium">{line.productName}</p>
              <p className="text-muted-foreground">
                Qty {line.quantity} · {formatMoney(line.unitPriceCents, currency)} each
              </p>
            </div>
            <p>{formatMoney(line.lineTotalCents, currency)}</p>
          </div>
        ))}
      </section>

      <aside className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold">Pay with Stripe</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Merchandise subtotal</dt>
            <dd>{formatMoney(preview.subtotalCents, currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>
              Shipping
              {preview.shippingMethodName ? ` · ${preview.shippingMethodName}` : ""}
            </dt>
            <dd>
              {preview.requiresShipping
                ? formatMoney(preview.shippingCents, currency)
                : "Not required"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Tax</dt>
            <dd className="text-right text-muted-foreground">{preview.estimatedTaxNote}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
            <dt>Total before tax</dt>
            <dd>{formatMoney(preview.totalBeforeTaxCents, currency)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Prices and shipping are recalculated on the server immediately before Checkout. Browser
          totals are never trusted. Stripe collects billing address
          {preview.requiresShipping ? " and shipping address" : ""}.
        </p>

        {canCheckout ? (
          <form action={action}>
            <input type="hidden" name="clientTotalCents" value={preview.totalBeforeTaxCents} />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Starting Checkout…" : "Continue to Stripe Checkout"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{blockedReason}</p>
            <Link href={toRoute("/cart")} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Return to cart
            </Link>
          </div>
        )}
        {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      </aside>
    </div>
  );
}
