import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { VoteBallotPanel } from "@/components/voting/vote-ballot-panel";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buildLoginPath } from "@/lib/auth/redirects";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  getPublicCampaignCategoryBySlug,
  listPublicCampaignCategories,
} from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";
import {
  getUserActiveVoteForCategory,
  listPublishedFinalists,
  listUserVoteProgress,
} from "@/lib/voting/service";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Vote" };
  }
  return buildCommunityMetadata(community, {
    title: `Vote · ${categorySlug} · ${community.name}`,
    pathname: `/vote/${categorySlug}`,
  });
}

export default async function VoteCategoryPage({ params }: Props) {
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
  const finalists =
    state.activePhase === "voting"
      ? await listPublishedFinalists({
          campaign,
          communityId: community.id,
          categorySlug: category.displaySlug,
        })
      : [];

  const categories = await listPublicCampaignCategories(campaign);
  const progress = session
    ? await listUserVoteProgress({
        userId: session.userId,
        campaignId: campaign.id,
        categories: categories.map((item) => ({
          id: item.id,
          displaySlug: item.displaySlug,
          displayName: item.displayName,
        })),
      })
    : [];
  const completed = progress.filter((item) => item.voted).length;
  const activeVote = session
    ? await getUserActiveVoteForCategory({
        userId: session.userId,
        campaignId: campaign.id,
        campaignCategoryId: category.id,
      })
    : null;

  return (
    <PageShell>
      <PageIntro
        eyebrow={category.groupName}
        title={category.displayName}
        description="Pick one finalist. Change your choice until voting closes. No live rankings."
      />
      <p className="mt-4 text-sm">
        <Link href={toRoute("/vote")} className="underline-offset-4 hover:underline">
          ← All categories
        </Link>
      </p>

      <div className="mt-8">
        {state.activePhase !== "voting" ? (
          <EmptyState
            title={state.votingLocked ? "Voting locked" : "Voting closed for this category"}
            description="Ballots are only available during the open voting window."
          />
        ) : !finalists.length ? (
          <EmptyState
            title="No published finalists"
            description="Finalists must be published before votes can be cast in this category."
          />
        ) : (
          <VoteBallotPanel
            campaignCategoryId={category.id}
            categorySlug={category.displaySlug}
            categoryName={category.displayName}
            finalists={finalists}
            selectedFinalistId={activeVote?.finalistId ?? null}
            isAuthenticated={Boolean(session)}
            emailConfirmed={Boolean(session?.emailConfirmed)}
            loginHref={buildLoginPath(`/vote/${category.displaySlug}`)}
            progress={{ completed, total: categories.length }}
          />
        )}
      </div>
    </PageShell>
  );
}
