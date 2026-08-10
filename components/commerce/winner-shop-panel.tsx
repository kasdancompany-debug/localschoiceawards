"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToCartAction, type CommerceActionState } from "@/lib/commerce/actions";
import { formatMoney, buildPersonalizationSnapshot } from "@/lib/commerce/rules";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/types/commerce";
import type { CommerceCurrency } from "@/types/commerce";

export type ShopEligibilityOption = {
  id: string;
  businessName: string;
  communityName: string;
  categoryName: string;
  campaignYear: number;
  placement: string;
};

const initial: CommerceActionState = { ok: false };

type WinnerShopPanelProps = {
  product: CatalogProduct;
  eligibilities: ShopEligibilityOption[];
  initialEligibilityId?: string;
  signedIn: boolean;
};

export function WinnerShopPanel({
  product,
  eligibilities,
  initialEligibilityId,
  signedIn,
}: WinnerShopPanelProps) {
  const [state, action, pending] = useActionState(addToCartAction, initial);
  const [eligibilityId, setEligibilityId] = useState(
    initialEligibilityId && eligibilities.some((item) => item.id === initialEligibilityId)
      ? initialEligibilityId
      : (eligibilities[0]?.id ?? ""),
  );
  const [currency, setCurrency] = useState<CommerceCurrency>(
    product.variants.find((variant) => variant.currencyCode === "CAD")?.currencyCode ??
      product.variants[0]?.currencyCode ??
      "CAD",
  );
  const [quantity, setQuantity] = useState(1);

  const variant = useMemo(
    () => product.variants.find((item) => item.currencyCode === currency) ?? product.variants[0],
    [currency, product.variants],
  );

  const selected = eligibilities.find((item) => item.id === eligibilityId);
  const preview =
    product.requiresAwardEligibility && selected
      ? buildPersonalizationSnapshot({
          awardEligibilityId: selected.id,
          businessName: selected.businessName,
          communityName: selected.communityName,
          categoryName: selected.categoryName,
          campaignYear: selected.campaignYear,
          placement: selected.placement,
          frozenAt: "preview",
        })
      : null;

  return (
    <div className="space-y-8">
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li>1. Choose eligible win</li>
        <li>2. Choose product currency</li>
        <li>3. Preview personalization</li>
        <li>4. Add to cart</li>
      </ol>

      {product.requiresAwardEligibility ? (
        <div className="space-y-2">
          <Label htmlFor="awardEligibilityId">Eligible win</Label>
          {eligibilities.length ? (
            <select
              id="awardEligibilityId"
              name="awardEligibilityId"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={eligibilityId}
              onChange={(event) => setEligibilityId(event.target.value)}
            >
              {eligibilities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.placement} · {item.categoryName} · {item.communityName} ·{" "}
                  {item.campaignYear}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground">
              {signedIn
                ? "No active award eligibilities on your businesses yet."
                : "Sign in with a business account that has a published win, or continue from the business awards portal."}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Winner wording is generated from eligibility — customers cannot freely type it.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <select
          id="currency"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          value={currency}
          onChange={(event) => setCurrency(event.target.value as CommerceCurrency)}
        >
          {product.variants.map((item) => (
            <option key={item.id} value={item.currencyCode}>
              {item.currencyCode} · {formatMoney(item.priceCents, item.currencyCode)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          A cart may not mix CAD and USD. Shipping is billed separately and is not included in
          this price.
        </p>
      </div>

      {preview ? (
        <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/30 p-4">
          <p className="text-sm font-medium">Personalization preview</p>
          <p className="font-heading text-xl font-semibold">{preview.businessName}</p>
          <p className="text-sm text-muted-foreground">
            {preview.placement} · {preview.categoryName}
          </p>
          <p className="text-sm text-muted-foreground">
            {preview.communityName} · {preview.campaignYear}
          </p>
        </div>
      ) : null}

      <form action={action} className="space-y-4">
        <input type="hidden" name="productVariantId" value={variant?.id ?? ""} />
        {product.requiresAwardEligibility ? (
          <input type="hidden" name="awardEligibilityId" value={eligibilityId} />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity (max {product.maxQuantity})</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={product.maxQuantity}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value) || 1)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={
              pending ||
              !variant ||
              (product.requiresAwardEligibility && (!eligibilityId || !eligibilities.length))
            }
          >
            {pending ? "Adding…" : "Add to cart"}
          </Button>
          <Link href={toRoute("/cart")} className={cn(buttonVariants({ variant: "outline" }))}>
            View cart
          </Link>
        </div>
        {state.message ? (
          <p className={cn("text-sm", state.ok ? "text-foreground" : "text-destructive")}>
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
