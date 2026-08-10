"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { toRoute } from "@/lib/routes";
import type { PublicCampaignCategory } from "@/types/campaign";

type Props = {
  categories: PublicCampaignCategory[];
};

export function NominateCategoryBrowser({ categories }: Props) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? categories.filter((category) => {
          const haystack = `${category.displayName} ${category.groupName}`.toLowerCase();
          return haystack.includes(needle);
        })
      : categories;

    const map = new Map<string, { groupName: string; groupSlug: string; items: PublicCampaignCategory[] }>();
    for (const category of filtered) {
      const existing = map.get(category.groupSlug) ?? {
        groupName: category.groupName,
        groupSlug: category.groupSlug,
        items: [],
      };
      existing.items.push(category);
      map.set(category.groupSlug, existing);
    }
    return [...map.values()].sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [categories, query]);

  return (
    <div className="space-y-8">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search category groups"
        className="h-12 max-w-xl"
        aria-label="Search categories"
      />
      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.groupSlug} className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">{group.groupName}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.items.map((category) => (
                <li key={category.id}>
                  <Link
                    href={toRoute(`/nominate/${category.displaySlug}`)}
                    className="block rounded-2xl border border-border/70 px-4 py-3 transition hover:border-foreground/30 hover:bg-muted/40"
                  >
                    <span className="font-medium text-foreground">{category.displayName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!groups.length ? (
          <p className="text-sm text-muted-foreground">No categories match that search.</p>
        ) : null}
      </div>
    </div>
  );
}
