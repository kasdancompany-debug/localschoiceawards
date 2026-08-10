"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { toRoute } from "@/lib/routes";
import type { PublicBusinessListing } from "@/types/business";

type BusinessDirectoryProps = {
  listings: PublicBusinessListing[];
  emptyTitle?: string;
  emptyDescription?: string;
  showSearch?: boolean;
};

export function BusinessDirectory({
  listings,
  emptyTitle = "No businesses found",
  emptyDescription = "Try another search, or submit a missing business.",
  showSearch = false,
}: BusinessDirectoryProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return listings;
    }
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
    <div className="space-y-6">
      {showSearch ? (
        <div>
          <label htmlFor="business-filter" className="sr-only">
            Filter businesses
          </label>
          <Input
            id="business-filter"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter results"
            className="h-11 max-w-md"
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((listing) => (
            <li key={`${listing.business.id}-${listing.location.id}`}>
              <Link
                href={toRoute(`/business/${listing.business.slug}`)}
                className="block rounded-2xl border border-border/80 bg-card px-5 py-5 transition hover:border-primary/30 hover:bg-accent/30"
              >
                <span className="font-heading text-lg font-semibold tracking-tight">
                  {listing.business.publicName}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {listing.location.serviceAreaBusiness
                    ? "Service area business"
                    : [listing.location.addressLine1, listing.location.city]
                        .filter(Boolean)
                        .join(", ") || listing.location.locationName}
                </span>
                {listing.categories.length ? (
                  <span className="mt-3 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {listing.categories
                      .slice(0, 3)
                      .map((category) => category.name)
                      .join(" · ")}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
