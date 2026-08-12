import type { Metadata } from "next";

import { OrderBusinessSearch } from "@/components/commerce/order-business-search";
import { PageShell } from "@/components/layout/page-shell";
import { searchPublicBusinessesInCommunity } from "@/lib/businesses";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";

type OrderSearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Order awards" };
  }
  return buildCommunityMetadata(community, {
    title: `Order & promote · ${community.name}`,
    description: `Search your business in ${community.name}, order winner awards, or promote your listing — no password required.`,
    pathname: "/order",
  });
}

export default async function CommunityOrderSearchPage({ searchParams }: OrderSearchPageProps) {
  const community = await getCurrentCommunity();
  if (!community) {
    return (
      <PageShell>
        <h1 className="font-heading text-3xl font-semibold">Order</h1>
        <p className="mt-2 text-muted-foreground">Community not available.</p>
      </PageShell>
    );
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const listings = await searchPublicBusinessesInCommunity({
    communityId: community.id,
    query,
    limit: 60,
  });

  return (
    <PageShell>
      <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
        Order awards & promote
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Find your business, add trophies with +, then pay at the bottom with Stripe. No password.
      </p>
      <div className="mt-10">
        <OrderBusinessSearch listings={listings} initialQuery={query} />
      </div>
    </PageShell>
  );
}
