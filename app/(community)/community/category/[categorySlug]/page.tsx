import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BusinessDirectory } from "@/components/businesses/business-directory";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { NominateDialog } from "@/components/nominations/nominate-dialog";
import { buildLoginPath } from "@/lib/auth/redirects";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { listBusinessesForCategory } from "@/lib/businesses";
import { getPublicCampaignCategoryBySlug } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";

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
  const session = await getAuthenticatedSession();
  const campaignState = resolveCampaignState(campaign);
  const nominationsOpen = campaignState.activePhase === "nomination";
  const loginHref = buildLoginPath(`/category/${category.displaySlug}`);

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
            nominate={{
              campaignCategoryId: category.id,
              categoryName: category.displayName,
              categorySlug: category.displaySlug,
              isAuthenticated: Boolean(session),
              emailConfirmed: Boolean(session?.emailConfirmed),
              loginHref,
              nominationsOpen,
            }}
          />
        ) : (
          <EmptyState
            title="No businesses listed yet"
            description="Know a business that belongs here? Nominate it and we’ll add it to the list and email them."
            action={
              nominationsOpen ? (
                <NominateDialog
                  mode="new"
                  campaignCategoryId={category.id}
                  categoryName={category.displayName}
                  categorySlug={category.displaySlug}
                  isAuthenticated={Boolean(session)}
                  emailConfirmed={Boolean(session?.emailConfirmed)}
                  loginHref={loginHref}
                  nominationsOpen={nominationsOpen}
                  triggerLabel="Nominate a business"
                />
              ) : undefined
            }
          />
        )}
      </div>
    </PageShell>
  );
}
