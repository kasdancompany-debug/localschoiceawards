import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buildLoginPath } from "@/lib/auth/redirects";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";
import { listUserVoteProgress } from "@/lib/voting/service";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Vote" };
  }
  return buildCommunityMetadata(community, {
    title: `Vote · ${community.name}`,
    description: `Cast your votes in ${community.name}. Live rankings and totals stay private until results publish.`,
    pathname: "/vote",
  });
}

export default async function VoteHomePage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  const session = await getAuthenticatedSession();
  const state = campaign ? resolveCampaignState(campaign) : null;
  const votingOpen = state?.activePhase === "voting";
  const categories = campaign && votingOpen ? await listPublicCampaignCategories(campaign) : [];
  const progress =
    session && campaign && categories.length
      ? await listUserVoteProgress({
          userId: session.userId,
          campaignId: campaign.id,
          categories: categories.map((category) => ({
            id: category.id,
            displaySlug: category.displaySlug,
            displayName: category.displayName,
          })),
        })
      : [];

  const completed = progress.filter((item) => item.voted).length;

  return (
    <PageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageIntro
          eyebrow={community.name}
          title="Vote"
          description={
            votingOpen
              ? "Choose one finalist per category. You can change your vote until voting closes. No live rankings or countdowns."
              : "Voting opens only during the active voting phase."
          }
        />
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={toRoute("/finalists")} className="underline-offset-4 hover:underline">
            View finalists
          </Link>
          {session ? (
            <Link href={toRoute("/vote/mine")} className="underline-offset-4 hover:underline">
              My completed categories
            </Link>
          ) : (
            <Link
              href={toRoute(buildLoginPath("/vote"))}
              className="underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <div className="mt-10">
        {!campaign ? (
          <EmptyState
            title="No published campaign"
            description="A community campaign must be published before voting can open."
          />
        ) : !votingOpen ? (
          <EmptyState
            title={state?.votingLocked ? "Voting is locked" : "Voting is closed"}
            description="Ballots are only available during the open voting window. Exact totals stay private until results publish."
          />
        ) : (
          <div className="space-y-6">
            {session ? (
              <p className="text-sm text-muted-foreground">
                Your progress: {completed} of {categories.length} categories
              </p>
            ) : null}
            <ul className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => {
                const item = progress.find((row) => row.categoryId === category.id);
                return (
                  <li key={category.id}>
                    <Link
                      href={toRoute(`/vote/${category.displaySlug}`)}
                      className="block rounded-2xl border border-border/80 bg-card px-4 py-4 transition hover:border-foreground/30"
                    >
                      <span className="font-medium">{category.displayName}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {item?.voted ? "Voted · change anytime until close" : "Not voted yet"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </PageShell>
  );
}
