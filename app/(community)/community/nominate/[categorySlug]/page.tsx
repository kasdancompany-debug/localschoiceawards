import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { NominateBusinessPanel } from "@/components/nominations/nominate-business-panel";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buildLoginPath } from "@/lib/auth/redirects";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { listBusinessesForCategory } from "@/lib/businesses";
import { getPublicCampaignCategoryBySlug } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Nominate" };
  }
  return buildCommunityMetadata(community, {
    title: `Nominate · ${categorySlug} · ${community.name}`,
    pathname: `/nominate/${categorySlug}`,
  });
}

export default async function NominateCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  if (!campaign) {
    notFound();
  }

  const state = resolveCampaignState(campaign);
  const category = await getPublicCampaignCategoryBySlug(campaign, categorySlug);
  if (!category) {
    notFound();
  }

  const session = await getAuthenticatedSession();
  const listings =
    state.activePhase === "nomination"
      ? await listBusinessesForCategory({
          communityId: community.id,
          categorySlug: category.displaySlug,
          limit: 120,
        })
      : [];

  const businesses = listings.map((listing) => ({
    locationId: listing.location.id,
    name: listing.business.publicName,
    city: listing.location.city,
  }));

  return (
    <PageShell>
      <PageIntro
        eyebrow={category.groupName}
        title={category.displayName}
        description="Search eligible businesses in this community, then submit your nomination. Cross-community nominations are blocked."
      />
      <p className="mt-4 text-sm">
        <Link href={toRoute("/nominate")} className="underline-offset-4 hover:underline">
          ← All categories
        </Link>
      </p>

      <div className="mt-8">
        {state.activePhase !== "nomination" ? (
          <EmptyState
            title="Nominations closed for this category"
            description="The nomination phase is not active for this campaign."
          />
        ) : (
          <NominateBusinessPanel
            campaignCategoryId={category.id}
            categoryName={category.displayName}
            businesses={businesses}
            isAuthenticated={Boolean(session)}
            emailConfirmed={Boolean(session?.emailConfirmed)}
            loginHref={buildLoginPath(`/nominate/${category.displaySlug}`)}
          />
        )}
      </div>
    </PageShell>
  );
}
