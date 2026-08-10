import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";

type Props = {
  searchParams: Promise<{ id?: string; pending?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Nomination confirmed" };
  }
  return buildCommunityMetadata(community, {
    title: `Nomination confirmed · ${community.name}`,
    pathname: "/nominate/success",
  });
}

export default async function NominateSuccessPage({ searchParams }: Props) {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const params = await searchParams;
  const pending = params.pending === "1";

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow={community.name}
        title={pending ? "Suggestion received" : "Nomination submitted"}
        description={
          pending
            ? "Your missing-business suggestion is in the moderation queue. It will not count until approved."
            : "Thank you. Your nomination is recorded. Exact nomination totals are never shown publicly."
        }
      />
      <div className="mt-8 space-y-3 text-sm">
        {params.id ? <p className="text-muted-foreground">Reference: {params.id}</p> : null}
        <div className="flex flex-wrap gap-4">
          <Link href={toRoute("/nominate")} className="underline-offset-4 hover:underline">
            Nominate another
          </Link>
          <Link href={toRoute("/nominate/mine")} className="underline-offset-4 hover:underline">
            View my nominations
          </Link>
        </div>
      </div>
      {!params.id ? (
        <div className="mt-8">
          <EmptyState
            title="No nomination reference"
            description="If you just submitted, return to nominate and try again."
          />
        </div>
      ) : null}
    </PageShell>
  );
}
