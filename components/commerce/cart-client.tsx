"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  quoteShippingAction,
  removeCartItemAction,
  selectShippingQuoteAction,
  updateCartItemAction,
  type CommerceActionState,
} from "@/lib/commerce/actions";
import { formatMoney } from "@/lib/commerce/rules";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CartLineView, CartTotals, CommerceCurrency } from "@/types/commerce";

const initial: CommerceActionState = { ok: false };

type CartClientProps = {
  lines: CartLineView[];
  totals: CartTotals;
  currency: CommerceCurrency | null;
};

export function CartClient({ lines, totals, currency }: CartClientProps) {
  const [qtyState, qtyAction, qtyPending] = useActionState(updateCartItemAction, initial);
  const [removeState, removeAction, removePending] = useActionState(removeCartItemAction, initial);
  const [shipState, shipAction, shipPending] = useActionState(quoteShippingAction, {
    ...initial,
    methods: [],
  });
  const [selectState, selectAction, selectPending] = useActionState(
    selectShippingQuoteAction,
    initial,
  );

  const displayCurrency = currency ?? "CAD";

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-6">
        {!lines.length ? (
          <p className="text-muted-foreground">Your cart is empty.</p>
        ) : (
          lines.map((line) => {
            const snap = line.item.personalizationSnapshot as {
              businessName?: string;
              categoryName?: string;
              communityName?: string;
              campaignYear?: number;
              placement?: string;
            };
            return (
              <article
                key={line.item.id}
                className="space-y-3 border-b border-border/70 pb-6 last:border-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl font-semibold">{line.productName}</h2>
                    <p className="text-sm text-muted-foreground">{line.variantName}</p>
                    {snap.businessName ? (
                      <p className="mt-2 text-sm">
                        Personalized for {snap.businessName} · {snap.placement} ·{" "}
                        {snap.categoryName} · {snap.communityName} · {snap.campaignYear}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-medium">
                    {formatMoney(line.lineTotalCents, line.currencyCode)}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <form action={qtyAction} className="flex items-end gap-2">
                    <input type="hidden" name="cartItemId" value={line.item.id} />
                    <div className="space-y-1">
                      <Label htmlFor={`qty-${line.item.id}`}>Qty</Label>
                      <Input
                        id={`qty-${line.item.id}`}
                        name="quantity"
                        type="number"
                        min={0}
                        defaultValue={line.item.quantity}
                        className="w-20"
                      />
                    </div>
                    <Button type="submit" variant="outline" disabled={qtyPending}>
                      Update
                    </Button>
                  </form>
                  <form action={removeAction}>
                    <input type="hidden" name="cartItemId" value={line.item.id} />
                    <Button type="submit" variant="ghost" disabled={removePending}>
                      Remove
                    </Button>
                  </form>
                </div>
              </article>
            );
          })
        )}
        {qtyState.message || removeState.message ? (
          <p className="text-sm text-muted-foreground">
            {qtyState.message || removeState.message}
          </p>
        ) : null}
      </section>

      <aside className="space-y-6">
        <div className="space-y-3">
          <h2 className="font-heading text-2xl font-semibold">Review</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotalCents, displayCurrency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Shipping{totals.shippingMethodName ? ` · ${totals.shippingMethodName}` : ""}</dt>
              <dd>
                {totals.requiresShipping
                  ? formatMoney(totals.shippingCents, displayCurrency)
                  : "Not required (digital)"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Estimated tax</dt>
              <dd>{formatMoney(totals.estimatedTaxCents, displayCurrency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
              <dt>Estimated total</dt>
              <dd>{formatMoney(totals.totalCents, displayCurrency)}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Shipping is a separate checkout cost and is calculated server-side. Payment with Stripe
            arrives in a later step.
          </p>
        </div>

        {totals.requiresShipping ? (
          <div className="space-y-4">
            <form action={shipAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="countryCode">Country</Label>
                <select
                  id="countryCode"
                  name="countryCode"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  defaultValue="CA"
                >
                  <option value="CA">Canada</option>
                  <option value="US">United States</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal or ZIP code</Label>
                <Input id="postalCode" name="postalCode" placeholder="K1A 0B1 or 10001" required />
              </div>
              <Button type="submit" disabled={shipPending || !lines.length}>
                {shipPending ? "Estimating…" : "Estimate shipping"}
              </Button>
            </form>
            {shipState.message ? (
              <p className={`text-sm ${shipState.ok ? "text-foreground" : "text-destructive"}`}>
                {shipState.message}
              </p>
            ) : null}
            {shipState.methods?.length ? (
              <div className="space-y-3">
                {shipState.methods.map((method) => (
                  <form
                    key={method.quoteId}
                    action={selectAction}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3"
                  >
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.description} · {method.estimatedMinDays}–{method.estimatedMaxDays}{" "}
                        days
                      </p>
                      <p className="text-sm">
                        {formatMoney(method.shippingCents, method.currencyCode as CommerceCurrency)}
                      </p>
                    </div>
                    <input type="hidden" name="quoteId" value={method.quoteId} />
                    <Button type="submit" variant="outline" disabled={selectPending}>
                      Select
                    </Button>
                  </form>
                ))}
                {selectState.message ? (
                  <p className="text-sm text-muted-foreground">{selectState.message}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <Link
          href={toRoute("/checkout")}
          className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center")}
        >
          Continue to card payment
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Stripe collects your card securely on the next step. No account password required.
        </p>
      </aside>
    </div>
  );
}
