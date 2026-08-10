"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { compactSearchText, normalizeSearchText } from "@/lib/communities/search";
import { groupPublicCategories } from "@/lib/campaigns/category-groups";
import { toRoute } from "@/lib/routes";
import type { PublicCampaignCategory } from "@/types/campaign";

type CategoryDirectoryProps = {
  categories: PublicCampaignCategory[];
  heading?: string;
};

function matchesCategory(category: PublicCampaignCategory, query: string): boolean {
  const normalized = normalizeSearchText(query);
  const compact = compactSearchText(query);
  if (!normalized) {
    return true;
  }
  const haystacks = [
    category.displayName,
    category.displayDescription,
    category.groupName,
    category.displaySlug,
  ];
  return haystacks.some((value) => {
    const n = normalizeSearchText(value);
    const c = compactSearchText(value);
    return n.includes(normalized) || c.includes(compact);
  });
}

export function CategoryDirectory({
  categories,
  heading = "Categories",
}: CategoryDirectoryProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => categories.filter((category) => matchesCategory(category, deferredQuery)),
    [categories, deferredQuery],
  );
  const groups = groupPublicCategories(filtered);

  if (categories.length === 0) {
    return (
      <EmptyState
        title="Categories coming soon"
        description="Campaign categories will appear here once the season is published."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{heading}</h2>
        <div className="w-full sm:max-w-sm">
          <label htmlFor="category-search" className="sr-only">
            Search categories
          </label>
          <Input
            id="category-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search category groups"
            className="h-11"
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No categories matched"
          description="Try a different search, or browse the full category list."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.groupSlug}>
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {group.groupName}
              </h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {group.categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={toRoute(`/category/${category.displaySlug}`)}
                      className="block rounded-2xl border border-border/80 bg-card px-4 py-4 transition hover:border-primary/30 hover:bg-accent/30"
                    >
                      <span className="font-medium text-foreground">{category.displayName}</span>
                      {category.displayDescription ? (
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                          {category.displayDescription}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
