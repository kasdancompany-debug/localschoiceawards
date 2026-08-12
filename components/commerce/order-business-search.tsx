"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { PublicBusinessListing } from "@/types/business";

type OrderBusinessSearchProps = {
  listings: PublicBusinessListing[];
  initialQuery?: string;
};

export function OrderBusinessSearch({ listings, initialQuery = "" }: OrderBusinessSearchProps) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return listings;
    return listings.filter((listing) => {
      const haystack = [
        listing.business.publicName,
        listing.location.locationName,
        listing.location.city,
        ...listing.categories.map((category) => category.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [listings, query]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <label htmlFor="order-business-q" className="text-sm font-medium">
          Please enter the name of the business you would like to order for
        </label>
        <Input
          id="order-business-q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Business name"
          className="h-14 text-base"
          autoFocus
        />
        <p className="text-sm text-muted-foreground">
          No password needed — search the directory, open the listing, add awards or promote, then
          pay with Stripe.
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching businesses"
          description="Try another spelling, or search again from the community directory."
        />
      ) : (
        <ul className="divide-y divide-border/70 border-y border-border/70">
          {filtered.map((listing) => (
            <li key={`${listing.business.id}-${listing.location.id}`}>
              <Link
                href={toRoute(`/order/${listing.business.slug}`)}
                className="flex items-center justify-between gap-4 py-4 transition hover:bg-muted/30"
              >
                <div>
                  <p className="font-heading text-lg font-semibold tracking-tight">
                    {listing.business.publicName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {listing.location.serviceAreaBusiness
                      ? "Service area business"
                      : [listing.location.addressLine1, listing.location.city]
                          .filter(Boolean)
                          .join(", ") || listing.location.locationName}
                  </p>
                </div>
                <span className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Continue
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
