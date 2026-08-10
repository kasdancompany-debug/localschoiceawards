import type { Metadata } from "next";

import { MissingBusinessForm } from "@/components/businesses/missing-business-form";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Missing business" };
  }
  return buildCommunityMetadata(community, {
    title: `Missing business · ${community.name}`,
    description: `Suggest a business that should be listed in ${community.name}.`,
    pathname: "/missing-business",
  });
}

export default async function MissingBusinessPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  const categories = campaign ? await listPublicCampaignCategories(campaign) : [];

  return (
    <PageShell>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <PageIntro
          eyebrow={community.name}
          title="Missing a business?"
          description="Tell us about a local business that should be considered for this season. Submissions are reviewed by moderators before listing."
        />
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
          {campaign ? (
            <MissingBusinessForm
              campaignId={campaign.id}
              categories={categories.map((category) => ({
                id: category.id,
                name: category.displayName,
              }))}
            />
          ) : (
            <EmptyState
              title="Submissions unavailable"
              description="A published campaign is required before missing-business requests can be accepted."
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
