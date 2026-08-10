import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";
import { listUserVoteProgress } from "@/lib/voting/service";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "My votes" };
  }
  return buildCommunityMetadata(community, {
    title: `My votes · ${community.name}`,
    pathname: "/vote/mine",
  });
}

export default async function MyVotesPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const session = await requireUser({ next: "/vote/mine" });
  const campaign = await getPublicCampaignForCommunity(community.id);
  const categories = campaign ? await listPublicCampaignCategories(campaign) : [];
  const progress = campaign
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

  const completed = progress.filter((item) => item.voted);

  return (
    <PageShell>
      <PageIntro
        eyebrow={community.name}
        title="My completed categories"
        description="Categories where you have an active vote. Totals and rankings stay private."
      />
      <p className="mt-4 text-sm">
        <Link href={toRoute("/vote")} className="underline-offset-4 hover:underline">
          ← Back to voting
        </Link>
      </p>

      <div className="mt-10 space-y-4">
        {completed.length ? (
          completed.map((item) => (
            <article
              key={item.categoryId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/80 bg-card px-5 py-4"
            >
              <div>
                <h2 className="font-heading text-lg font-semibold">{item.categoryName}</h2>
                <p className="text-sm text-muted-foreground">Vote recorded</p>
              </div>
              <Link
                href={toRoute(`/vote/${item.categorySlug}`)}
                className="text-sm underline-offset-4 hover:underline"
              >
                Change vote
              </Link>
            </article>
          ))
        ) : (
          <EmptyState
            title="No completed categories yet"
            description="When you cast votes during an open phase, they appear here."
          />
        )}
      </div>
    </PageShell>
  );
}
