"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { placementLabel } from "@/lib/results/rules";
import { toRoute } from "@/lib/routes";
import type { PublicWinnerView } from "@/types/results";
import Link from "next/link";

type Props = {
  winners: PublicWinnerView[];
  year: number;
  showExactCounts: boolean;
};

export function WinnersDirectory({ winners, year, showExactCounts }: Props) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    if (!needle) return winners;
    return winners.filter((winner) =>
      `${winner.businessName} ${winner.categoryName} ${winner.groupName} ${winner.placement}`
        .toLowerCase()
        .includes(needle),
    );
  }, [winners, deferred]);

  const byCategory = useMemo(() => {
    const map = new Map<string, PublicWinnerView[]>();
    for (const winner of filtered) {
      const list = map.get(winner.categorySlug) ?? [];
      list.push(winner);
      map.set(winner.categorySlug, list);
    }
    return [...map.entries()].sort((a, b) =>
      (a[1][0]?.categoryName ?? "").localeCompare(b[1][0]?.categoryName ?? ""),
    );
  }, [filtered]);

  return (
    <div className="space-y-8">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search winners by business, category, or placement"
        className="h-12 max-w-xl"
        aria-label="Search winners"
      />

      {byCategory.map(([slug, items]) => (
        <section key={slug} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {items[0]?.categoryName}
            </h2>
            <Link
              href={toRoute(`/winners/${year}/${slug}`)}
              className="text-sm underline-offset-4 hover:underline"
            >
              Category page
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((winner) => (
              <li
                key={winner.resultId}
                className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card px-4 py-3"
              >
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {winner.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={winner.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="font-semibold text-muted-foreground">
                      {winner.businessName.slice(0, 1)}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {placementLabel(winner.placement)}
                    {winner.tied ? " · tied" : ""}
                  </p>
                  <Link
                    href={toRoute(`/business/${winner.businessSlug}`)}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {winner.businessName}
                  </Link>
                  {showExactCounts && winner.validVoteCount !== null ? (
                    <p className="text-xs text-muted-foreground">{winner.validVoteCount} votes</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!byCategory.length ? (
        <p className="text-sm text-muted-foreground">No winners match that search.</p>
      ) : null}
    </div>
  );
}
