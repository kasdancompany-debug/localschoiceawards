import type { Metadata } from "next";

import { CategoryDirectory } from "@/components/communities/category-directory";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Categories" };
  }
  return buildCommunityMetadata(community, {
    title: `Categories · ${community.name}`,
    description: `Browse Locals Choice Awards categories in ${community.name}.`,
    pathname: "/categories",
  });
}

export default async function CommunityCategoriesPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  const categories = campaign ? await listPublicCampaignCategories(campaign) : [];

  return (
    <PageShell>
      <PageIntro
        eyebrow={campaign ? `${campaign.year} season` : "Categories"}
        title="Award categories"
        description={`Explore the groups residents can celebrate in ${community.name}.`}
      />
      <div className="mt-10">
        {campaign ? (
          <CategoryDirectory categories={categories} heading="Category groups" />
        ) : (
          <EmptyState
            title="No categories yet"
            description="Categories appear when a campaign is published for this community."
          />
        )}
      </div>
    </PageShell>
  );
}
