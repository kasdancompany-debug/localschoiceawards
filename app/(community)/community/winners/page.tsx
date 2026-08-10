import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { listPublishedResultCampaignsForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { campaignHasPublishedResults } from "@/lib/results/service";
import { toRoute } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Winners" };
  }
  return buildCommunityMetadata(community, {
    title: `Winners · ${community.name}`,
    description: `Published Locals Choice Awards winners for ${community.name}.`,
    pathname: "/winners",
  });
}

export default async function CommunityWinnersPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const candidates = await listPublishedResultCampaignsForCommunity(community.id);
  const published = [];
  for (const campaign of candidates) {
    if (await campaignHasPublishedResults(campaign.id)) {
      published.push(campaign);
    }
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow={community.name}
        title="Winners"
        description="Historical winners stay available by campaign year after an audited result run is published."
      />
      <div className="mt-10">
        {published.length === 0 ? (
          <EmptyState
            title="Winners not published yet"
            description="When this community publishes audited results, winning years will appear here permanently."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {published.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  href={toRoute(`/winners/${campaign.year}`)}
                  className="flex items-center justify-between rounded-2xl border border-border/80 bg-card px-5 py-5 transition hover:border-primary/30 hover:bg-accent/30"
                >
                  <span>
                    <span className="block font-heading text-xl font-semibold">
                      {campaign.year}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {campaign.name}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-primary">View</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
