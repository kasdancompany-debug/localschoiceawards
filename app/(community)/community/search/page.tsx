import type { Metadata } from "next";
import Link from "next/link";

import { BusinessDirectory } from "@/components/businesses/business-directory";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPublicBusinessesInCommunity } from "@/lib/businesses";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Search" };
  }
  return buildCommunityMetadata(community, {
    title: `Search · ${community.name}`,
    description: `Search businesses and categories in ${community.name}.`,
    pathname: "/search",
  });
}

export default async function CommunitySearchPage({ searchParams }: SearchPageProps) {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const categorySlug = params.category?.trim() ?? "";

  const campaign = await getPublicCampaignForCommunity(community.id);
  const categories = campaign ? await listPublicCampaignCategories(campaign) : [];
  const listings = await searchPublicBusinessesInCommunity({
    communityId: community.id,
    query,
    categorySlug: categorySlug || undefined,
    limit: 48,
  });

  return (
    <PageShell>
      <PageIntro
        eyebrow={community.name}
        title="Search"
        description="Find local businesses and award categories. Exact vote totals are never shown here."
      />

      <form className="mt-8 flex flex-col gap-3 sm:flex-row" action="/search" method="get">
        <label htmlFor="q" className="sr-only">
          Search businesses and categories
        </label>
        <Input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Search businesses or categories"
          className="h-12 flex-1"
        />
        <button type="submit" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}>
          Search
        </button>
      </form>

      {categories.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={toRoute(query ? `/search?q=${encodeURIComponent(query)}` : "/search")}
            className={cn(
              buttonVariants({ variant: categorySlug ? "outline" : "secondary", size: "sm" }),
            )}
          >
            All categories
          </Link>
          {categories.slice(0, 12).map((category) => (
            <Link
              key={category.id}
              href={toRoute(
                `/search?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  category: category.displaySlug,
                }).toString()}`,
              )}
              className={cn(
                buttonVariants({
                  variant: categorySlug === category.displaySlug ? "secondary" : "outline",
                  size: "sm",
                }),
              )}
            >
              {category.displayName}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-10">
        <BusinessDirectory
          listings={listings}
          emptyTitle={query || categorySlug ? "No matches" : "No businesses yet"}
          emptyDescription="Try another search, or tell us about a missing business."
        />
      </div>

      <div className="mt-10">
        <Link
          href={toRoute("/missing-business")}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-5")}
        >
          Submit a missing business
        </Link>
      </div>
    </PageShell>
  );
}
