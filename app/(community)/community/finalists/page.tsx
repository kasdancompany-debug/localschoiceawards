import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";
import { listPublishedFinalists } from "@/lib/voting/service";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Finalists" };
  }
  return buildCommunityMetadata(community, {
    title: `Finalists · ${community.name}`,
    description: `Published finalists for ${community.name}. Nomination counts are never shown publicly.`,
    pathname: "/finalists",
  });
}

export default async function FinalistsPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  const state = campaign ? resolveCampaignState(campaign) : null;
  const finalists =
    campaign && state?.canPublicReadCampaign
      ? await listPublishedFinalists({ campaign, communityId: community.id })
      : [];

  const byCategory = new Map<string, typeof finalists>();
  for (const finalist of finalists) {
    const list = byCategory.get(finalist.categorySlug) ?? [];
    list.push(finalist);
    byCategory.set(finalist.categorySlug, list);
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow={community.name}
        title="Finalists"
        description="Published finalists for this season. Exact nomination counts stay private."
      />
      {state?.activePhase === "voting" ? (
        <p className="mt-4 text-sm">
          <Link href={toRoute("/vote")} className="underline-offset-4 hover:underline">
            Go to voting →
          </Link>
        </p>
      ) : null}

      <div className="mt-10 space-y-10">
        {[...byCategory.entries()].length ? (
          [...byCategory.entries()].map(([slug, items]) => (
            <section key={slug} className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {items[0]?.categoryName}
                </h2>
                {state?.activePhase === "voting" ? (
                  <Link
                    href={toRoute(`/vote/${slug}`)}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Vote in this category
                  </Link>
                ) : null}
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((finalist) => (
                  <li
                    key={finalist.id}
                    className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card px-4 py-3"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {finalist.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={finalist.logoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="font-semibold text-muted-foreground">
                          {finalist.businessName.slice(0, 1)}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{finalist.businessName}</p>
                      <p className="text-sm text-muted-foreground">{finalist.locationName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <EmptyState
            title="Finalists not published yet"
            description="Once administrators publish finalists, they appear here without nomination totals or live rankings."
          />
        )}
      </div>
    </PageShell>
  );
}
