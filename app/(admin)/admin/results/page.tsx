import Link from "next/link";

import {
  ApproveResultRunForm,
  PublishResultRunForm,
  RevokeEligibilityForm,
  StartResultRunForm,
} from "@/components/admin/results-admin-forms";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { listCampaignsForCommunity } from "@/lib/campaigns/service";
import { PILOT_COMMUNITIES } from "@/lib/communities/pilot-catalog";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { placementLabel } from "@/lib/results/rules";
import {
  listAdminEligibilities,
  listResultRuns,
  listResultsForRun,
} from "@/lib/results/service";
import { toRoute } from "@/lib/routes";

type Props = {
  searchParams: Promise<{
    tab?: string;
    communityId?: string;
    campaignId?: string;
    runId?: string;
  }>;
};

const TABS = [
  { id: "runs", label: "Result runs" },
  { id: "review", label: "Review results" },
  { id: "eligibilities", label: "Eligibilities" },
] as const;

export default async function AdminResultsPage({ searchParams }: Props) {
  await requireAdminSession("/admin/results");
  const params = await searchParams;
  const tab = TABS.some((item) => item.id === params.tab) ? params.tab! : "runs";

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
    // Pilot fallback.
  }

  const communityId = params.communityId || communities[0]?.id || "";
  const campaigns = communityId ? await listCampaignsForCommunity(communityId) : [];
  const campaignId = params.campaignId || campaigns[0]?.id || "";
  const runs = campaignId ? await listResultRuns(campaignId) : [];
  const selectedRunId = params.runId || runs[0]?.id || "";
  const results = selectedRunId ? await listResultsForRun(selectedRunId) : [];
  const eligibilities = campaignId ? await listAdminEligibilities(campaignId) : [];

  const queryBase = new URLSearchParams();
  if (communityId) queryBase.set("communityId", communityId);
  if (campaignId) queryBase.set("campaignId", campaignId);
  if (selectedRunId) queryBase.set("runId", selectedRunId);

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Results & eligibility"
        description="Compute an immutable audited result run from valid votes, approve, publish winners, and manage award eligibility without deleting history."
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
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.year})
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
              href={toRoute(`/admin/results?${qs.toString()}`)}
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
        {tab === "runs" && campaignId ? (
          <div className="space-y-6">
            <StartResultRunForm campaignId={campaignId} />
            {runs.map((run) => (
              <article
                key={run.id}
                className="grid gap-4 rounded-3xl border border-border/80 bg-card p-5 lg:grid-cols-[1.4fr_1fr]"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{run.id}</p>
                  <p>Status: {run.status}</p>
                  <p>Started: {new Date(run.startedAt).toLocaleString()}</p>
                  <p>Completed: {run.completedAt ? new Date(run.completedAt).toLocaleString() : "—"}</p>
                  <p>Approved: {run.approvedAt ? new Date(run.approvedAt).toLocaleString() : "—"}</p>
                  <p>Published: {run.publishedAt ? new Date(run.publishedAt).toLocaleString() : "—"}</p>
                  <p className="text-muted-foreground">
                    Rules snapshot frozen on the run (competition ranking, valid votes only).
                  </p>
                </div>
                <div className="space-y-3">
                  {run.status === "pending_approval" ? (
                    <ApproveResultRunForm resultRunId={run.id} />
                  ) : null}
                  {run.status === "approved" ? (
                    <PublishResultRunForm resultRunId={run.id} />
                  ) : null}
                  <Link
                    href={toRoute(
                      `/admin/results?${new URLSearchParams({
                        ...Object.fromEntries(queryBase),
                        tab: "review",
                        runId: run.id,
                      }).toString()}`,
                    )}
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Review result rows
                  </Link>
                </div>
              </article>
            ))}
            {!runs.length ? (
              <EmptyState
                title="No result runs"
                description="Start a run to tally valid votes into an immutable snapshot."
              />
            ) : null}
          </div>
        ) : null}

        {tab === "review" ? (
          results.length ? (
            <div className="overflow-x-auto rounded-3xl border border-border/80">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3">Placement</th>
                    <th className="px-4 py-3">Finalist</th>
                    <th className="px-4 py-3">Valid votes</th>
                    <th className="px-4 py-3">Tied</th>
                    <th className="px-4 py-3">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{placementLabel(row.placement)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.finalistId}</td>
                      <td className="px-4 py-3">{row.validVoteCount}</td>
                      <td className="px-4 py-3">{row.tied ? "yes" : "no"}</td>
                      <td className="px-4 py-3">{row.published ? "yes" : "no"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No results for this run" description="Select a run or compute one first." />
          )
        ) : null}

        {tab === "eligibilities" ? (
          eligibilities.length ? (
            eligibilities.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-3xl border border-border/80 bg-card p-5 lg:grid-cols-[1.4fr_1fr]"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {placementLabel(item.placement)} · {item.personalizedCategoryName}
                  </p>
                  <p>
                    {item.personalizedBusinessName} · {item.personalizedCommunityName} ·{" "}
                    {item.personalizedCampaignYear}
                  </p>
                  <p>Status: {item.eligibilityStatus}</p>
                  {item.revocationReason ? <p>Reason: {item.revocationReason}</p> : null}
                </div>
                {item.eligibilityStatus === "active" ? (
                  <RevokeEligibilityForm eligibilityId={item.id} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Revoked — historical result preserved.
                  </p>
                )}
              </article>
            ))
          ) : (
            <EmptyState
              title="No eligibilities"
              description="Eligibilities are created when a result run is published."
            />
          )
        ) : null}

        {!campaignId ? (
          <EmptyState title="Select a campaign" description="Choose a community campaign." />
        ) : null}
      </div>
    </PageShell>
  );
}
