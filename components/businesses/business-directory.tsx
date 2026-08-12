"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { NominateDialog } from "@/components/nominations/nominate-dialog";
import { Input } from "@/components/ui/input";
import { toRoute } from "@/lib/routes";
import type { PublicBusinessListing } from "@/types/business";

type NominateContext = {
  campaignCategoryId: string;
  categoryName: string;
  categorySlug: string;
  isAuthenticated: boolean;
  emailConfirmed: boolean;
  loginHref: string;
  nominationsOpen: boolean;
};

type BusinessDirectoryProps = {
  listings: PublicBusinessListing[];
  emptyTitle?: string;
  emptyDescription?: string;
  showSearch?: boolean;
  nominate?: NominateContext;
};

export function BusinessDirectory({
  listings: initialListings,
  emptyTitle = "No businesses found",
  emptyDescription = "Try another search, or submit a missing business.",
  showSearch = false,
  nominate,
}: BusinessDirectoryProps) {
  const [query, setQuery] = useState("");
  const [extraListings, setExtraListings] = useState<PublicBusinessListing[]>([]);

  const listings = useMemo(() => {
    const byLocation = new Map<string, PublicBusinessListing>();
    for (const listing of [...extraListings, ...initialListings]) {
      byLocation.set(listing.location.id, listing);
    }
    return Array.from(byLocation.values());
  }, [extraListings, initialListings]);

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

      {nominate?.nominationsOpen ? (
        <div className="flex flex-wrap items-center gap-3">
          <NominateDialog
            mode="new"
            campaignCategoryId={nominate.campaignCategoryId}
            categoryName={nominate.categoryName}
            categorySlug={nominate.categorySlug}
            isAuthenticated={nominate.isAuthenticated}
            emailConfirmed={nominate.emailConfirmed}
            loginHref={nominate.loginHref}
            nominationsOpen={nominate.nominationsOpen}
            onNominated={(listing) => {
              if (listing) {
                setExtraListings((current) => [listing, ...current]);
              }
            }}
          />
          <p className="text-sm text-muted-foreground">
            Or nominate a business already listed below.
          </p>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((listing) => (
            <li key={`${listing.business.id}-${listing.location.id}`}>
              <div className="rounded-2xl border border-border/80 bg-card px-5 py-5 transition hover:border-primary/30 hover:bg-accent/30">
                <Link
                  href={toRoute(`/business/${listing.business.slug}`)}
                  className="block"
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
                {nominate?.nominationsOpen ? (
                  <div className="mt-4">
                    <NominateDialog
                      mode="existing"
                      campaignCategoryId={nominate.campaignCategoryId}
                      categoryName={nominate.categoryName}
                      categorySlug={nominate.categorySlug}
                      listing={listing}
                      isAuthenticated={nominate.isAuthenticated}
                      emailConfirmed={nominate.emailConfirmed}
                      loginHref={nominate.loginHref}
                      nominationsOpen={nominate.nominationsOpen}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
