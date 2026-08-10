import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { BusinessDirectory } from "@/components/businesses/business-directory";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { listBusinessesForCategory } from "@/lib/businesses";
import { getPublicCampaignCategoryBySlug } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CategoryPageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Category" };
  }
  const campaign = await getPublicCampaignForCommunity(community.id);
  const category = campaign
    ? await getPublicCampaignCategoryBySlug(campaign, categorySlug)
    : null;

  return buildCommunityMetadata(community, {
    title: category
      ? `${category.displayName} · ${community.name}`
      : `Category · ${community.name}`,
    description: category?.displayDescription || `Category details for ${community.name}.`,
    pathname: `/category/${categorySlug}`,
  });
}

export default async function CommunityCategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  if (!campaign) {
    notFound();
  }

  const category = await getPublicCampaignCategoryBySlug(campaign, categorySlug);
  if (!category) {
    notFound();
  }

  const listings = await listBusinessesForCategory({
    communityId: community.id,
    categorySlug: category.displaySlug,
  });

  return (
    <PageShell>
      <PageIntro
        eyebrow={category.groupName}
        title={category.displayName}
        description={category.displayDescription || undefined}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Part of the {campaign.year} {community.name} Locals Choice Awards season.
      </p>

      <div className="mt-10">
        {listings.length ? (
          <BusinessDirectory
            listings={listings}
            showSearch
            emptyTitle="No businesses in this category yet"
            emptyDescription="Approved listings will appear here as the directory grows."
          />
        ) : (
          <EmptyState
            title="No businesses listed yet"
            description="Know a business that belongs here? Submit it for review."
            action={
              <Link
                href={toRoute("/missing-business")}
                className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}
              >
                Submit a missing business
              </Link>
            }
          />
        )}
      </div>
    </PageShell>
  );
}
