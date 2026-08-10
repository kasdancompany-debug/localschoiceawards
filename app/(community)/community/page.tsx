import type { Metadata } from "next";
import Link from "next/link";

import { CampaignCtaButton } from "@/components/communities/campaign-cta-button";
import { CampaignDeadlines } from "@/components/communities/campaign-deadlines";
import { CategoryDirectory } from "@/components/communities/category-directory";
import { LaunchListForm } from "@/components/forms/public-forms";
import { EmptyState } from "@/components/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getCampaignPrimaryCta, getCampaignStatusLabel } from "@/lib/campaigns/cta";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { getPublicCampaignForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { buildCommunityJsonLd } from "@/lib/communities/seo";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Community" };
  }
  const campaign = await getPublicCampaignForCommunity(community.id);
  return buildCommunityMetadata(community, {
    title: community.displayName,
    description: campaign
      ? `${campaign.year} Locals Choice Awards in ${community.name}. ${getCampaignStatusLabel(resolveCampaignState(campaign).resolvedState)}.`
      : `Locals Choice Awards for ${community.name}, ${community.region.name}.`,
    pathname: "/",
  });
}

export default async function CommunityHomePage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const campaign = await getPublicCampaignForCommunity(community.id);
  const campaignState = campaign ? resolveCampaignState(campaign) : null;
  const categories = campaign ? await listPublicCampaignCategories(campaign) : [];
  const cta = getCampaignPrimaryCta(campaignState);
  const jsonLd = buildCommunityJsonLd({ community, campaign, pathname: "/" });

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="surface-tint border-b border-border/60">
        <PageShell className="pb-16 pt-12 sm:pb-20 sm:pt-16">
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
            {community.region.name}, {community.country.name}
          </p>
          <h1 className="font-heading mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {community.name}
          </h1>
          <p className="mt-3 font-heading text-xl text-muted-foreground sm:text-2xl">
            Locals Choice Awards
            {campaign ? ` · ${campaign.year}` : ""}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {campaignState ? (
              <span className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                {getCampaignStatusLabel(campaignState.resolvedState)}
              </span>
            ) : (
              <span className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                Season coming soon
              </span>
            )}
            <CampaignCtaButton cta={cta} />
          </div>

          {!campaign ? (
            <div className="mt-10 max-w-xl">
              <EmptyState
                className="bg-card/70"
                title="No published campaign yet"
                description="Join the launch list to hear when nominations open in this community."
              />
            </div>
          ) : null}
        </PageShell>
      </section>

      <PageShell className="space-y-16">
        {campaign ? <CampaignDeadlines campaign={campaign} /> : null}

        <CategoryDirectory categories={categories} heading="Searchable categories" />

        <section className="rounded-3xl border border-border/80 bg-card px-6 py-10 sm:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Local supporters</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Community partners and sponsors will appear here as the season launches. Want to support{" "}
            {community.name}? Reach out through the business owner path below.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Presenting partner", "Media partner", "Category sponsor"].map((label) => (
              <div
                key={label}
                className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground"
              >
                {label} placeholder
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 rounded-3xl border border-border/80 bg-card px-6 py-10 sm:grid-cols-[1.2fr_1fr] sm:px-8">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Own a local business?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Create an account to follow your category, claim your listing when available, and get
              notified as nominations and voting open.
            </p>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex h-12 px-6")}
            >
              Business owner sign-up
            </Link>
          </div>
          <div id="launch-list" className="rounded-2xl bg-muted/50 p-5">
            <h3 className="font-heading text-lg font-semibold">Join the launch list</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get an email when this community season moves to the next phase.
            </p>
            <div className="mt-4">
              <LaunchListForm communityId={community.id} />
            </div>
          </div>
        </section>
      </PageShell>
    </div>
  );
}
