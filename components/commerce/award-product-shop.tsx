"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { addToCartAction, type CommerceActionState } from "@/lib/commerce/actions";
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

type AwardProductShopProps = {
  businessName: string;
  wins: OrderWin[];
  products: CatalogProduct[];
  currencyCode: CommerceCurrency;
  currentYear?: number;
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
    "Shipping is calculated separately at checkout",
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
      <p className="text-sm font-medium">
        &ldquo;{label}&rdquo;
      </p>
    </div>
  );
}

export function AwardProductShop({
  businessName,
  wins,
  products,
  currencyCode,
  currentYear,
}: AwardProductShopProps) {
  const [quantities, setQuantities] = useState<Record<QtyKey, number>>({});
  const [showPreviousYears, setShowPreviousYears] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  const selectedLines = useMemo(() => {
    const lines: Array<{
      product: CatalogProduct;
      variantId: string;
      eligibilityId: string;
      quantity: number;
      win: OrderWin;
      priceCents: number;
    }> = [];

    for (const product of products) {
      const variant =
        product.variants.find((item) => item.currencyCode === currencyCode) ??
        product.variants[0];
      if (!variant) continue;
      for (const win of wins) {
        const quantity = quantities[qtyKey(product.id, win.eligibilityId)] ?? 0;
        if (quantity <= 0) continue;
        lines.push({
          product,
          variantId: variant.id,
          eligibilityId: win.eligibilityId,
          quantity,
          win,
          priceCents: variant.priceCents,
        });
      }
    }
    return lines;
  }, [products, wins, quantities, currencyCode]);

  const selectedCount = selectedLines.reduce((sum, line) => sum + line.quantity, 0);
  const selectedSubtotal = selectedLines.reduce(
    (sum, line) => sum + line.priceCents * line.quantity,
    0,
  );

  function setQty(productId: string, eligibilityId: string, next: number) {
    setQuantities((current) => ({
      ...current,
      [qtyKey(productId, eligibilityId)]: next,
    }));
  }

  function addSelectedToCart() {
    if (!selectedLines.length) {
      setMessage("Use + to choose quantities for each win, then add them to your cart.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      let added = 0;
      for (const line of selectedLines) {
        const formData = new FormData();
        formData.set("productVariantId", line.variantId);
        formData.set("awardEligibilityId", line.eligibilityId);
        formData.set("quantity", String(line.quantity));
        const result: CommerceActionState = await addToCartAction({ ok: false }, formData);
        if (!result.ok) {
          setMessage(result.message ?? "Unable to add some items. Try again.");
          return;
        }
        added += line.quantity;
      }
      setQuantities({});
      setMessage(`Added ${added} item${added === 1 ? "" : "s"} to your cart.`);
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
      <p className="text-sm text-muted-foreground">
        Award products are temporarily unavailable.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Products available for purchase
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Use + / − beside each winning category to order as many trophies, plaques, or decals as
          you need. We personalize and dropship after Stripe payment — shipping is calculated in
          the cart.
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
                        <li>
                          Available for published {businessName} wins — personalized per category
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        Choose quantities for each qualifying win
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
                                disabled={pending}
                                label={label}
                                onChange={(next) =>
                                  setQty(product.id, win.eligibilityId, next)
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
                          {showPreviousYears
                            ? "Hide previous years"
                            : "Show previous years"}
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

      <div className="sticky bottom-4 z-10 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-medium">
              {selectedCount
                ? `${selectedCount} item${selectedCount === 1 ? "" : "s"} selected · ${formatMoney(selectedSubtotal, currencyCode)}`
                : "No items selected yet"}
            </p>
            <p className="text-muted-foreground">
              Shipping & tax calculated at checkout. Margins come after dropship cost.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={addSelectedToCart} disabled={pending || !selectedCount}>
              {pending ? "Adding…" : "Add selected to cart"}
            </Button>
            <Link href={toRoute("/cart")} className={cn(buttonVariants({ variant: "outline" }))}>
              View cart & pay
            </Link>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-foreground">{message}</p> : null}
      </div>
    </div>
  );
}

/** @deprecated Prefer AwardProductShop */
export const AwardQuickAdd = AwardProductShop;
