import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { getSignedBusinessMediaUrl } from "@/lib/businesses";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { placementLabel } from "@/lib/results/rules";
import {
  campaignHasPublishedResults,
  listPublishedWinners,
} from "@/lib/results/service";
import { toRoute } from "@/lib/routes";

type Props = {
  params: Promise<{ year: string; categorySlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, categorySlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Winners" };
  }
  return buildCommunityMetadata(community, {
    title: `${categorySlug} winners ${year} · ${community.name}`,
    pathname: `/winners/${year}/${categorySlug}`,
  });
}

export default async function WinnersCategoryPage({ params }: Props) {
  const { year: yearParam, categorySlug } = await params;
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
  if (!state.canPublicReadResults || !(await campaignHasPublishedResults(campaign.id))) {
    notFound();
  }

  const winners = await listPublishedWinners({
    campaign,
    communityId: community.id,
    categorySlug,
  });

  if (!winners.length) {
    notFound();
  }

  const withLogos = await Promise.all(
    winners.map(async (winner) => ({
      ...winner,
      logoUrl: winner.logoUrl ? await getSignedBusinessMediaUrl(winner.logoUrl) : null,
    })),
  );

  const categoryName = withLogos[0]?.categoryName ?? categorySlug;

  return (
    <PageShell>
      <PageIntro
        eyebrow={`${year} · ${withLogos[0]?.groupName}`}
        title={categoryName}
        description="Published placements for this category. Live rankings are never shown during voting."
      />
      <p className="mt-4 text-sm">
        <Link href={toRoute(`/winners/${year}`)} className="underline-offset-4 hover:underline">
          ← {year} winners
        </Link>
      </p>

      <ul className="mt-10 space-y-4">
        {withLogos.map((winner) => (
          <li
            key={winner.resultId}
            className="flex flex-wrap items-center gap-4 rounded-3xl border border-border/80 bg-card px-5 py-4"
          >
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
              {winner.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={winner.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  {winner.businessName.slice(0, 1)}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {placementLabel(winner.placement)}
                {winner.tied ? " · tied" : ""}
              </p>
              <Link
                href={toRoute(`/business/${winner.businessSlug}`)}
                className="font-heading text-xl font-semibold underline-offset-4 hover:underline"
              >
                {winner.businessName}
              </Link>
              <p className="text-sm text-muted-foreground">{winner.locationName}</p>
              {state.canPublicReadExactVoteTotals && winner.validVoteCount !== null ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {winner.validVoteCount} valid votes
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {!withLogos.length ? (
        <EmptyState title="No winners" description="No published placements in this category." />
      ) : null}
    </PageShell>
  );
}
