import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { listUserNominations } from "@/lib/nominations/service";
import { toRoute } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "My nominations" };
  }
  return buildCommunityMetadata(community, {
    title: `My nominations · ${community.name}`,
    pathname: "/nominate/mine",
  });
}

export default async function MyNominationsPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const session = await requireUser({ next: "/nominate/mine" });
  const campaign = await getPublicCampaignForCommunity(community.id);
  const nominations = campaign
    ? await listUserNominations({ userId: session.userId, campaignId: campaign.id })
    : [];

  return (
    <PageShell>
      <PageIntro
        eyebrow={community.name}
        title="My nominations"
        description="Nominations you submitted in the current published campaign. Exact community totals stay private."
      />
      <p className="mt-4 text-sm">
        <Link href={toRoute("/nominate")} className="underline-offset-4 hover:underline">
          ← Back to nominate
        </Link>
      </p>

      <div className="mt-10 space-y-4">
        {nominations.length ? (
          nominations.map((nomination) => (
            <article
              key={nomination.id}
              className="rounded-3xl border border-border/80 bg-card px-5 py-4"
            >
              <h2 className="font-heading text-lg font-semibold">
                {nomination.businessName ?? nomination.pendingBusinessName ?? "Business"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {nomination.categoryName} · {nomination.status.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(nomination.createdAt).toLocaleString()}
              </p>
            </article>
          ))
        ) : (
          <EmptyState
            title="No nominations yet"
            description="When you nominate during an open phase, your submissions appear here."
          />
        )}
      </div>
    </PageShell>
  );
}
