import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WinnersDirectory } from "@/components/results/winners-directory";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import {
  getPublicCampaignForCommunity,
  listPublishedResultCampaignsForCommunity,
} from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import {
  campaignHasPublishedResults,
  listPublishedWinners,
} from "@/lib/results/service";
import { getSignedBusinessMediaUrl } from "@/lib/businesses";
import { toRoute } from "@/lib/routes";

type Props = { params: Promise<{ year: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Winners" };
  }
  return buildCommunityMetadata(community, {
    title: `${year} winners · ${community.name}`,
    description: `${year} Locals Choice Awards winners in ${community.name}.`,
    pathname: `/winners/${year}`,
  });
}

export default async function CommunityWinnersYearPage({ params }: Props) {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);
  if (!Number.isFinite(year)) {
    notFound();
  }

  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id, year);
  if (!campaign) {
    notFound();
  }

  const state = resolveCampaignState(campaign);
  if (!state.canPublicReadResults) {
    return (
      <PageShell narrow>
        <PageIntro
          eyebrow={`${year} season`}
          title="Results not published yet"
          description="Winners stay private until the campaign publish date and an approved result run is published."
        />
      </PageShell>
    );
  }

  const hasPublished = await campaignHasPublishedResults(campaign.id);
  if (!hasPublished) {
    const publishedYears = await listPublishedResultCampaignsForCommunity(community.id);
    if (!publishedYears.some((item) => item.year === year && item.id === campaign.id)) {
      // Fall through to empty if schedule says readable but no run yet
    }
  }

  if (!hasPublished) {
    return (
      <PageShell>
        <PageIntro
          eyebrow={community.name}
          title={`${year} winners`}
          description="Audited results have not been published for this year yet."
        />
        <div className="mt-10">
          <EmptyState
            title="No published result run"
            description="Administrators must approve and publish an immutable result run before winners appear."
          />
        </div>
      </PageShell>
    );
  }

  const winners = await listPublishedWinners({
    campaign,
    communityId: community.id,
  });

  const withLogos = await Promise.all(
    winners.map(async (winner) => ({
      ...winner,
      logoUrl: winner.logoUrl ? await getSignedBusinessMediaUrl(winner.logoUrl) : null,
    })),
  );

  return (
    <PageShell>
      <PageIntro
        eyebrow={community.name}
        title={`${year} winners`}
        description={`${campaign.name}. Exact vote totals remain hidden unless this campaign enables them.`}
      />
      <p className="mt-4 text-sm">
        <Link href={toRoute("/winners")} className="underline-offset-4 hover:underline">
          ← All years
        </Link>
      </p>
      <div className="mt-10">
        {withLogos.length ? (
          <WinnersDirectory
            winners={withLogos}
            year={year}
            showExactCounts={state.canPublicReadExactVoteTotals}
          />
        ) : (
          <EmptyState
            title="No winners listed"
            description="Published result rows will appear here by category."
          />
        )}
      </div>
    </PageShell>
  );
}
