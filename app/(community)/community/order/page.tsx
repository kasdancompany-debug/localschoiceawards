import type { Metadata } from "next";
import Link from "next/link";

import { OrderBusinessSearch } from "@/components/commerce/order-business-search";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { searchPublicBusinessesInCommunity } from "@/lib/businesses";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

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
        <PageIntro title="Order" description="Community not available." />
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow={community.name}
          title="Order awards & promote"
          description="Search the directory, open your business, add trophies per win, or start a monthly promotion — then pay with Stripe."
        />
        <Link href={toRoute("/cart")} className={cn(buttonVariants({ variant: "outline" }))}>
          Cart
        </Link>
      </div>

      <div className="mt-10">
        <OrderBusinessSearch listings={listings} initialQuery={query} />
      </div>
    </PageShell>
  );
}
