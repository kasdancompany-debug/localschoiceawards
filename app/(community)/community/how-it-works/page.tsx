import type { Metadata } from "next";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "How it works" };
  }
  return buildCommunityMetadata(community, {
    title: `How it works · ${community.name}`,
    description: `How Locals Choice Awards works in ${community.name}.`,
    pathname: "/how-it-works",
  });
}

const steps = [
  {
    title: "Watch the season open",
    body: "Check this site for nomination and voting windows in your community timezone.",
  },
  {
    title: "Nominate local favourites",
    body: "When nominations open, suggest the businesses and professionals you trust.",
  },
  {
    title: "Vote once ballots open",
    body: "Cast your votes in the categories that matter. Results stay private until publication day.",
  },
  {
    title: "Celebrate winners",
    body: "Published winners remain available by year so the community can revisit them anytime.",
  },
];

export default async function CommunityHowItWorksPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow={community.name}
        title="How it works"
        description="A clear season for residents and business owners — nominate, vote, then celebrate."
      />
      <ol className="mt-12 grid gap-6 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-3xl border border-border/80 bg-card px-6 py-8">
            <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Step {index + 1}
            </p>
            <h2 className="font-heading mt-3 text-2xl font-semibold tracking-tight">{step.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
