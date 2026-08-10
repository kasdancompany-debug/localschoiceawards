import type { Metadata } from "next";
import Link from "next/link";

import { NominateCategoryBrowser } from "@/components/nominations/nominate-category-browser";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { buildLoginPath } from "@/lib/auth/redirects";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Nominate" };
  }
  return buildCommunityMetadata(community, {
    title: `Nominate · ${community.name}`,
    description: `Nominate local favourites in ${community.name}.`,
    pathname: "/nominate",
  });
}

export default async function NominatePage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  const session = await getAuthenticatedSession();
  const state = campaign ? resolveCampaignState(campaign) : null;
  const nominationsOpen = state?.activePhase === "nomination";
  const categories = campaign && nominationsOpen ? await listPublicCampaignCategories(campaign) : [];

  return (
    <PageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageIntro
          eyebrow={community.name}
          title="Nominate"
          description={
            nominationsOpen
              ? "Browse category groups, pick a category, and nominate an eligible local business."
              : "Nominations open only during the active nomination phase for this season."
          }
        />
        <div className="flex flex-wrap gap-3 text-sm">
          {session ? (
            <Link href={toRoute("/nominate/mine")} className="underline-offset-4 hover:underline">
              My nominations
            </Link>
          ) : (
            <Link
              href={toRoute(buildLoginPath("/nominate"))}
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
            description="A community campaign must be published before nominations can open."
          />
        ) : !nominationsOpen ? (
          <EmptyState
            title="Nominations are closed"
            description="You can browse categories once the nomination window opens. Exact nomination totals are never shown publicly."
          />
        ) : (
          <NominateCategoryBrowser categories={categories} />
        )}
      </div>
    </PageShell>
  );
}
