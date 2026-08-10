import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { toRoute } from "@/lib/routes";

type Props = {
  searchParams: Promise<{ id?: string; changed?: string; category?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Vote confirmed" };
  }
  return buildCommunityMetadata(community, {
    title: `Vote confirmed · ${community.name}`,
    pathname: "/vote/success",
  });
}

export default async function VoteSuccessPage({ searchParams }: Props) {
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const params = await searchParams;
  const changed = params.changed === "1";

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow={community.name}
        title={changed ? "Vote updated" : "Vote recorded"}
        description="Thank you. You can change your choice until voting closes. Exact totals stay private until results publish."
      />
      <div className="mt-8 space-y-3 text-sm">
        {params.id ? <p className="text-muted-foreground">Reference: {params.id}</p> : null}
        <div className="flex flex-wrap gap-4">
          {params.category ? (
            <Link
              href={toRoute(`/vote/${params.category}`)}
              className="underline-offset-4 hover:underline"
            >
              Change this vote
            </Link>
          ) : null}
          <Link href={toRoute("/vote")} className="underline-offset-4 hover:underline">
            Continue voting
          </Link>
          <Link href={toRoute("/vote/mine")} className="underline-offset-4 hover:underline">
            My completed categories
          </Link>
        </div>
      </div>
      {!params.id ? (
        <div className="mt-8">
          <EmptyState
            title="No vote reference"
            description="If you just voted, return to voting and try again."
          />
        </div>
      ) : null}
    </PageShell>
  );
}
