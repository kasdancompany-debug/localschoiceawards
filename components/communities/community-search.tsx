"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useId, useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CommunitySearchRecord } from "@/lib/communities/search";
import {
  filterCommunitySearchRecords,
  groupCommunitiesByCountry,
  groupCommunitiesByRegion,
} from "@/lib/communities/search";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { initPostHogBrowser, posthog } from "@/lib/analytics/posthog-browser";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

type CommunitySearchProps = {
  /** When true, show region groups once results load. */
  showDirectory?: boolean;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
};

async function trackClick(payload: {
  query: string;
  communityId: string;
  subdomain: string;
  name: string;
}) {
  initPostHogBrowser();
  posthog.capture?.(ANALYTICS_EVENTS.communitySearchClick, payload);
  try {
    await fetch("/api/communities/search/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Analytics must never block navigation.
  }
}

export function CommunitySearch({
  showDirectory = false,
  className,
  inputClassName,
  autoFocus = false,
}: CommunitySearchProps) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [catalog, setCatalog] = useState<CommunitySearchRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/communities/search?q=&limit=100");
          if (!response.ok) {
            throw new Error("Unable to load communities.");
          }
          const data = (await response.json()) as { results: CommunitySearchRecord[] };
          if (!cancelled) {
            setCatalog(data.results);
            setLoadError(null);
          }
        } catch {
          if (!cancelled) {
            setLoadError("Community search is temporarily unavailable.");
            setCatalog([]);
          }
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (catalog === null) {
      return;
    }
    initPostHogBrowser();
    const matches = filterCommunitySearchRecords(catalog, deferredQuery);
    posthog.capture?.(ANALYTICS_EVENTS.communitySearch, {
      query: deferredQuery,
      resultCount: matches.length,
    });
    if (deferredQuery.trim() && matches.length === 0) {
      posthog.capture?.(ANALYTICS_EVENTS.communitySearchZeroResults, {
        query: deferredQuery,
      });
    }
  }, [catalog, deferredQuery]);

  const matches =
    catalog === null ? [] : filterCommunitySearchRecords(catalog, deferredQuery).slice(0, 40);
  const countries = groupCommunitiesByCountry(groupCommunitiesByRegion(matches));

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search communities in Canada and the United States
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={inputId}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your city, town, or region"
          autoComplete="off"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className={cn(
            "h-14 rounded-2xl border-border/80 bg-card pl-12 text-base shadow-sm md:text-base",
            inputClassName,
          )}
        />
      </div>

      <div className="mt-3 min-h-6 text-sm text-muted-foreground" aria-live="polite">
        {catalog === null || isPending
          ? "Loading communities…"
          : loadError
            ? loadError
            : deferredQuery.trim()
              ? matches.length === 0
                ? "No communities matched that search."
                : `${matches.length} community${matches.length === 1 ? "" : "ies"} found`
              : showDirectory
                ? "Browse by province, territory, or state."
                : "Start typing to find your community."}
      </div>

      {catalog !== null && (showDirectory || deferredQuery.trim()) ? (
        <div id={listId} className="mt-8 space-y-10" role="listbox" aria-label="Community results">
          {countries.length === 0 ? null : (
            countries.map((country) => (
              <section key={country.countryCode} className="space-y-6">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {country.countryName}
                </h2>
                {country.regions.map((region) => (
                  <div key={`${country.countryCode}-${region.regionCode}`} className="space-y-3">
                    <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                      {region.regionName}
                    </h3>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {region.communities.map((community) => (
                        <li key={community.id}>
                          {community.isActive && community.url ? (
                            <a
                              href={community.url}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4 transition hover:border-primary/30 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50"
                              onClick={() => {
                                void trackClick({
                                  query: deferredQuery,
                                  communityId: community.id,
                                  subdomain: community.subdomain,
                                  name: community.name,
                                });
                              }}
                            >
                              <span>
                                <span className="block font-medium text-foreground">
                                  {community.name}
                                </span>
                                <span className="mt-1 block text-sm text-muted-foreground">
                                  {community.regionName}
                                </span>
                              </span>
                              <span className="text-sm font-medium text-primary">Open</span>
                            </a>
                          ) : (
                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-4">
                              <span>
                                <span className="block font-medium text-foreground">
                                  {community.name}
                                </span>
                                <span className="mt-1 block text-sm text-muted-foreground">
                                  {community.regionName}
                                </span>
                              </span>
                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-wide text-secondary-foreground uppercase">
                                Coming Soon
                              </span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))
          )}

          {deferredQuery.trim() && matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <p className="font-heading text-lg font-semibold">Don’t see your community?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Request a Locals Choice Awards launch for your city or town.
              </p>
              <a
                href="/launch-a-community"
                className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex h-12 px-6")}
              >
                Request your community
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {!showDirectory && !deferredQuery.trim() && catalog !== null ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Searching Canada and the United States.{" "}
          <Link href={toRoute("/communities")} className="font-medium text-primary underline-offset-4 hover:underline">
            Browse all communities
          </Link>
        </p>
      ) : null}
    </div>
  );
}
