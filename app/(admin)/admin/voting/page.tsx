import Link from "next/link";

import {
  GenerateFinalistsForm,
  InvalidateVoteForm,
  LockVotingForm,
  ManualAddFinalistForm,
  PublishFinalistsForm,
  ReviewFinalistForm,
} from "@/components/admin/voting-admin-forms";
import { ReviewFraudSignalForm } from "@/components/admin/nomination-admin-forms";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { listPublicCampaignCategories } from "@/lib/campaigns/categories";
import { listCampaignsForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { PILOT_COMMUNITIES } from "@/lib/communities/pilot-catalog";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { listFraudSignals } from "@/lib/nominations/service";
import { toRoute } from "@/lib/routes";
import {
  buildVotingAuditReport,
  getVotingActivity,
  listAdminFinalists,
  listAdminVotes,
  listInvalidatedVotes,
} from "@/lib/voting/service";

type Props = {
  searchParams: Promise<{
    tab?: string;
    communityId?: string;
    campaignId?: string;
  }>;
};

const TABS = [
  { id: "generate", label: "Generate" },
  { id: "review", label: "Review finalists" },
  { id: "publish", label: "Publish" },
  { id: "activity", label: "Voting activity" },
  { id: "fraud", label: "Fraud queue" },
  { id: "invalidations", label: "Invalidate votes" },
  { id: "lock", label: "Lock voting" },
  { id: "audit", label: "Audit reports" },
] as const;

export default async function AdminVotingPage({ searchParams }: Props) {
  await requireAdminSession("/admin/voting");
  const params = await searchParams;
  const tab = TABS.some((item) => item.id === params.tab) ? params.tab! : "generate";

  let communities = PILOT_COMMUNITIES.map((community) => ({
    id: community.id,
    name: community.name,
  }));
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("communities")
      .select("id, name")
      .eq("is_public", true)
      .order("name");
    if (data?.length) {
      communities = data;
    }
  } catch {
    // Pilot catalog fallback.
  }

  const communityId = params.communityId || communities[0]?.id || "";
  const campaigns = communityId ? await listCampaignsForCommunity(communityId) : [];
  const campaignId = params.campaignId || campaigns[0]?.id || "";
  const campaign = campaigns.find((item) => item.id === campaignId) ?? null;
  const state = campaign ? resolveCampaignState(campaign) : null;

  const categories = campaign ? await listPublicCampaignCategories(campaign) : [];

  const [finalists, votes, invalidated, activity, fraud, audit] = await Promise.all([
    campaignId ? listAdminFinalists(campaignId) : Promise.resolve([]),
    campaignId ? listAdminVotes(campaignId) : Promise.resolve([]),
    campaignId ? listInvalidatedVotes(campaignId) : Promise.resolve([]),
    campaignId ? getVotingActivity(campaignId) : Promise.resolve([]),
    campaignId ? listFraudSignals(campaignId) : Promise.resolve([]),
    campaignId ? buildVotingAuditReport(campaignId) : Promise.resolve(""),
  ]);

  const queryBase = new URLSearchParams();
  if (communityId) queryBase.set("communityId", communityId);
  if (campaignId) queryBase.set("campaignId", campaignId);

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Finalists & voting"
        description="Generate and review finalists, publish for voting, monitor activity, fraud, invalidations, locks, and audits. Public surfaces never show live totals."
      />

      <form className="mt-8 flex flex-wrap gap-3" method="get">
        <input type="hidden" name="tab" value={tab} />
        <label className="text-sm">
          Community
          <select
            name="communityId"
            defaultValue={communityId}
            className="ml-2 h-9 rounded-lg border border-input bg-transparent px-2"
          >
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Campaign
          <select
            name="campaignId"
            defaultValue={campaignId}
            className="ml-2 h-9 rounded-lg border border-input bg-transparent px-2"
          >
            {campaigns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.year})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-9 rounded-lg border border-border px-3 text-sm hover:bg-muted">
          Apply
        </button>
      </form>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        {TABS.map((item) => {
          const qs = new URLSearchParams(queryBase);
          qs.set("tab", item.id);
          return (
            <Link
              key={item.id}
              href={toRoute(`/admin/voting?${qs.toString()}`)}
              className={`rounded-full border px-3 py-1 ${
                tab === item.id ? "border-foreground bg-muted" : "border-border"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 space-y-4">
        {tab === "generate" && campaignId ? (
          <div className="space-y-6">
            <GenerateFinalistsForm campaignId={campaignId} />
            <ManualAddFinalistForm
              campaignId={campaignId}
              categories={categories.map((category) => ({
                id: category.id,
                name: category.displayName,
              }))}
            />
          </div>
        ) : null}

        {tab === "review" ? (
          finalists.length ? (
            finalists.map((finalist) => (
              <article
                key={finalist.id}
                className="grid gap-4 rounded-3xl border border-border/80 bg-card p-5 lg:grid-cols-[1.4fr_1fr]"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{finalist.id}</p>
                  <p>Status: {finalist.status}</p>
                  <p>Method: {finalist.selectionMethod}</p>
                  <p>Category: {finalist.campaignCategoryId}</p>
                  <p>Location: {finalist.businessLocationId}</p>
                  <p>
                    Snapshot:{" "}
                    {finalist.nominationCountSnapshot === null
                      ? "not frozen"
                      : "(admin-only, hidden from public)"}
                  </p>
                  {finalist.adminNotes ? <p>Notes: {finalist.adminNotes}</p> : null}
                  {finalist.removalReason ? <p>Removal: {finalist.removalReason}</p> : null}
                </div>
                {finalist.status === "proposed" || finalist.status === "approved" ? (
                  <ReviewFinalistForm finalistId={finalist.id} />
                ) : (
                  <p className="text-sm text-muted-foreground">No review actions for this status.</p>
                )}
              </article>
            ))
          ) : (
            <EmptyState title="No finalists" description="Generate proposals first." />
          )
        ) : null}

        {tab === "publish" && campaignId ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Publishes all approved finalists and freezes nomination-count snapshots. Public pages
              never display those counts.
            </p>
            <PublishFinalistsForm campaignId={campaignId} />
          </div>
        ) : null}

        {tab === "activity" ? (
          activity.length ? (
            <div className="overflow-x-auto rounded-3xl border border-border/80">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3">Category ID</th>
                    <th className="px-4 py-3">Active votes</th>
                    <th className="px-4 py-3">Invalidated</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row) => (
                    <tr key={row.campaignCategoryId} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{row.campaignCategoryId}</td>
                      <td className="px-4 py-3">{row.activeVotes}</td>
                      <td className="px-4 py-3">{row.invalidatedVotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No voting activity" description="Activity appears after votes are cast." />
          )
        ) : null}

        {tab === "fraud" ? (
          fraud.length ? (
            fraud.map((signal) => (
              <article
                key={signal.id}
                className="grid gap-4 rounded-3xl border border-border/80 bg-card p-5 lg:grid-cols-[1.4fr_1fr]"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{signal.signalType}</p>
                  <p>
                    {signal.entityType} · {signal.entityId}
                  </p>
                  <p>Risk: {signal.riskScore}</p>
                  <p>Status: {signal.status}</p>
                </div>
                {signal.status === "open" ? <ReviewFraudSignalForm signalId={signal.id} /> : null}
              </article>
            ))
          ) : (
            <EmptyState title="Fraud queue empty" description="Signals appear when rules fail." />
          )
        ) : null}

        {tab === "invalidations" ? (
          <div className="space-y-4">
            {votes
              .filter((vote) => vote.status === "active")
              .map((vote) => (
                <article
                  key={vote.id}
                  className="grid gap-4 rounded-3xl border border-border/80 bg-card p-5 lg:grid-cols-[1.4fr_1fr]"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{vote.id}</p>
                    <p>User: {vote.userId}</p>
                    <p>Finalist: {vote.finalistId}</p>
                    <p>Created: {new Date(vote.createdAt).toLocaleString()}</p>
                  </div>
                  <InvalidateVoteForm voteId={vote.id} />
                </article>
              ))}
            {invalidated.map((vote) => (
              <article key={vote.id} className="rounded-3xl border border-border/80 bg-card p-5 text-sm">
                <p className="font-medium">{vote.id}</p>
                <p>Reason: {vote.invalidationReason}</p>
                <p>By: {vote.invalidatedBy}</p>
                <p>At: {vote.invalidatedAt}</p>
              </article>
            ))}
            {!votes.length ? (
              <EmptyState title="No votes" description="Votes appear once ballots are cast." />
            ) : null}
          </div>
        ) : null}

        {tab === "lock" && campaignId ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current lock: {state?.votingLocked ? "locked" : "unlocked"}. Locking closes ballots
              without deleting vote history.
            </p>
            <LockVotingForm campaignId={campaignId} locked={Boolean(state?.votingLocked)} />
          </div>
        ) : null}

        {tab === "audit" && campaignId ? (
          <pre className="max-h-[560px] overflow-auto rounded-3xl border border-border/80 bg-card p-4 text-xs whitespace-pre-wrap">
            {audit}
          </pre>
        ) : null}

        {!campaignId ? (
          <EmptyState title="Select a campaign" description="Choose a community campaign to continue." />
        ) : null}
      </div>
    </PageShell>
  );
}
