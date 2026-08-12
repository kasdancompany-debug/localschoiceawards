"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { setCartLineQuantityAction } from "@/lib/commerce/actions";
import { formatMoney } from "@/lib/commerce/rules";
import { placementLabel } from "@/lib/results/rules";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CatalogProduct, CommerceCurrency } from "@/types/commerce";
import type { ResultPlacement } from "@/types/results";

export type OrderWin = {
  eligibilityId: string;
  placement: ResultPlacement;
  categoryName: string;
  campaignYear: number;
  businessName: string;
};

export type InitialCartQty = {
  productId: string;
  productVariantId: string;
  eligibilityId: string;
  quantity: number;
};

type AwardProductShopProps = {
  businessName: string;
  wins: OrderWin[];
  products: CatalogProduct[];
  currencyCode: CommerceCurrency;
  currentYear?: number;
  initialQuantities?: InitialCartQty[];
  initialItemCount?: number;
  initialSubtotalCents?: number;
};

type QtyKey = string;

function qtyKey(productId: string, eligibilityId: string): QtyKey {
  return `${productId}:${eligibilityId}`;
}

function productBullets(description: string): string[] {
  const parts = description
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(0, 4);
  }
  return [
    description,
    "Engraved with the business name and winning category",
    "Made to order and dropshipped after payment",
    "Shipping is calculated at payment",
  ].filter(Boolean);
}

function productGroup(product: CatalogProduct): string {
  const slug = product.slug;
  if (slug.includes("glass")) return "Engraved glass trophies";
  if (slug.includes("plaque")) return "Wall plaques";
  if (slug.includes("decal") || slug.includes("sticker")) return "Window decals & stickers";
  if (slug.includes("bundle")) return "Recognition bundles";
  return "Awards";
}

function QuantityStepper({
  value,
  max,
  disabled,
  onChange,
  label,
}: {
  value: number;
  max: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center overflow-hidden rounded-lg border border-primary/40 bg-primary/5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="h-10 w-10 text-lg font-semibold text-primary disabled:opacity-40"
          disabled={disabled || value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <span className="min-w-10 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="h-10 w-10 text-lg font-semibold text-primary disabled:opacity-40"
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
      <p className="text-sm font-medium">&ldquo;{label}&rdquo;</p>
    </div>
  );
}

function buildInitialMap(initial?: InitialCartQty[]): Record<QtyKey, number> {
  const map: Record<QtyKey, number> = {};
  for (const row of initial ?? []) {
    map[qtyKey(row.productId, row.eligibilityId)] = row.quantity;
  }
  return map;
}

export function AwardProductShop({
  businessName,
  wins,
  products,
  currencyCode,
  currentYear,
  initialQuantities,
  initialItemCount = 0,
  initialSubtotalCents = 0,
}: AwardProductShopProps) {
  const [quantities, setQuantities] = useState<Record<QtyKey, number>>(() =>
    buildInitialMap(initialQuantities),
  );
  const [cartCount, setCartCount] = useState(initialItemCount);
  const [cartSubtotal, setCartSubtotal] = useState(initialSubtotalCents);
  const [showPreviousYears, setShowPreviousYears] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const latestYear = useMemo(() => {
    if (typeof currentYear === "number") return currentYear;
    return wins.reduce((max, win) => Math.max(max, win.campaignYear), 0);
  }, [currentYear, wins]);

  const visibleWins = useMemo(() => {
    if (showPreviousYears || !latestYear) return wins;
    const current = wins.filter((win) => win.campaignYear === latestYear);
    return current.length ? current : wins;
  }, [wins, showPreviousYears, latestYear]);

  const hasPreviousYears = wins.some((win) => win.campaignYear !== latestYear);

  const groups = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>();
    for (const product of products) {
      const group = productGroup(product);
      const list = map.get(group) ?? [];
      list.push(product);
      map.set(group, list);
    }
    return Array.from(map.entries());
  }, [products]);

  function syncQuantity(input: {
    product: CatalogProduct;
    eligibilityId: string;
    next: number;
  }) {
    const variant =
      input.product.variants.find((item) => item.currencyCode === currencyCode) ??
      input.product.variants[0];
    if (!variant) return;

    const key = qtyKey(input.product.id, input.eligibilityId);
    const previous = quantities[key] ?? 0;
    setQuantities((current) => ({ ...current, [key]: input.next }));
    setPendingKey(key);
    setMessage(null);

    startTransition(async () => {
      const result = await setCartLineQuantityAction({
        productVariantId: variant.id,
        awardEligibilityId: input.eligibilityId,
        quantity: input.next,
      });
      setPendingKey(null);
      if (!result.ok) {
        setQuantities((current) => ({ ...current, [key]: previous }));
        setMessage(result.message ?? "Could not update cart.");
        return;
      }
      setCartCount(result.itemCount ?? 0);
      setCartSubtotal(result.subtotalCents ?? 0);
    });
  }

  if (!wins.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No published wins yet for {businessName}. You can still promote the listing below.
      </p>
    );
  }

  if (!products.length) {
    return (
      <p className="text-sm text-muted-foreground">Award products are temporarily unavailable.</p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Products available for purchase
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tap + beside each win to fill your cart instantly. Pay at the bottom with Stripe —
          shipping is calculated before card details.
        </p>
      </div>

      {groups.map(([groupName, groupProducts]) => (
        <section key={groupName} className="space-y-5">
          <h3 className="font-heading text-xl font-semibold tracking-tight text-primary">
            {groupName}
          </h3>
          <ul className="space-y-6">
            {groupProducts.map((product) => {
              const variant =
                product.variants.find((item) => item.currencyCode === currencyCode) ??
                product.variants[0];
              if (!variant) return null;
              const bullets = productBullets(product.description);

              return (
                <li
                  key={product.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6"
                >
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                    <div className="space-y-3">
                      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 text-center">
                        <p className="font-heading text-lg font-semibold tracking-tight">
                          {product.name}
                        </p>
                      </div>
                      <p className="text-base font-semibold">
                        {product.name}{" "}
                        <span className="text-muted-foreground">
                          {formatMoney(variant.priceCents, variant.currencyCode)} each
                        </span>
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        Quantities for each qualifying win
                      </p>
                      <ul className="space-y-3">
                        {visibleWins.map((win) => {
                          const key = qtyKey(product.id, win.eligibilityId);
                          const value = quantities[key] ?? 0;
                          const label = `${placementLabel(win.placement)} in ${win.categoryName}${
                            win.campaignYear !== latestYear ? ` · ${win.campaignYear}` : ""
                          }`;
                          return (
                            <li key={key}>
                              <QuantityStepper
                                value={value}
                                max={product.maxQuantity}
                                disabled={pending && pendingKey === key}
                                label={label}
                                onChange={(next) =>
                                  syncQuantity({
                                    product,
                                    eligibilityId: win.eligibilityId,
                                    next,
                                  })
                                }
                              />
                            </li>
                          );
                        })}
                      </ul>
                      {hasPreviousYears ? (
                        <button
                          type="button"
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          onClick={() => setShowPreviousYears((current) => !current)}
                        >
                          {showPreviousYears ? "Hide previous years" : "Show previous years"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-background/95 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm">
            <p className="font-semibold">
              Cart {cartCount} ·{" "}
              {formatMoney(cartSubtotal, currencyCode)}
            </p>
            <p className="text-muted-foreground">
              {cartCount
                ? "Next: enter shipping, then pay by card with Stripe."
                : "Use + to add trophies and plaques for each win."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={toRoute("/cart")}
              className={cn(
                buttonVariants({ size: "lg" }),
                !cartCount && "pointer-events-none opacity-50",
              )}
            >
              {cartCount ? "Review cart & pay" : "Cart empty"}
            </Link>
            <Link href={toRoute("/order")} className={cn(buttonVariants({ variant: "outline" }))}>
              Search another business
            </Link>
          </div>
        </div>
        {message ? (
          <p className="mx-auto max-w-6xl px-4 pb-3 text-sm text-destructive sm:px-6">{message}</p>
        ) : null}
      </div>
    </div>
  );
}

export const AwardQuickAdd = AwardProductShop;
