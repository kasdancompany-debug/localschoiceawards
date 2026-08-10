import type { Metadata } from "next";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Rules" };
  }
  return buildCommunityMetadata(community, {
    title: `Rules · ${community.name}`,
    description: `Promotion rules for Locals Choice Awards in ${community.name}.`,
    pathname: "/rules",
  });
}

export default async function CommunityRulesPage() {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow={community.name}
        title="Community rules"
        description="Participate honestly. Exact vote totals stay private unless this campaign publishes them."
      />
      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Nomination and voting windows follow the published campaign schedule for {community.name}.
          Late submissions are not accepted after a phase closes.
        </p>
        <p>
          One person should participate under their own identity. Attempts to manipulate nominations
          or votes may result in disqualification for entries or ballots.
        </p>
        <p>
          Businesses may encourage fair participation but must not buy, coerce, or automate votes.
          Finalists, audits, and published winners are determined by authorized campaign operators.
        </p>
        <p>Void where prohibited. Additional platform terms and promotion rules also apply.</p>
      </div>
    </PageShell>
  );
}
