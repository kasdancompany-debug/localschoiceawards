import Link from "next/link";

import {
  InvalidateNominationForm,
  ReviewFraudSignalForm,
} from "@/components/admin/nomination-admin-forms";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { listCampaignsForCommunity } from "@/lib/campaigns/service";
import { PILOT_COMMUNITIES } from "@/lib/communities/pilot-catalog";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import {
  exportNominationsCsv,
  getCategoryActivity,
  listAdminNominations,
  listFraudSignals,
  listInvalidatedNominations,
  listPendingMissingBusinessNominations,
} from "@/lib/nominations/service";
import { toRoute } from "@/lib/routes";

type Props = {
  searchParams: Promise<{
    tab?: string;
    communityId?: string;
    campaignId?: string;
  }>;
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "missing", label: "Missing business" },
  { id: "fraud", label: "Fraud flags" },
  { id: "invalidations", label: "Invalidations" },
  { id: "activity", label: "Category activity" },
  { id: "export", label: "Export" },
] as const;

export default async function AdminNominationsPage({ searchParams }: Props) {
  await requireAdminSession("/admin/nominations");
  const params = await searchParams;
  const tab = TABS.some((item) => item.id === params.tab) ? params.tab! : "overview";

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
    // Use pilot catalog.
  }

  const communityId = params.communityId || communities[0]?.id || "";
  const campaigns = communityId ? await listCampaignsForCommunity(communityId) : [];
  const campaignId = params.campaignId || campaigns[0]?.id || "";

  const [nominations, missing, fraud, invalidated, activity] = await Promise.all([
    campaignId ? listAdminNominations(campaignId) : Promise.resolve([]),
    listPendingMissingBusinessNominations(),
    campaignId ? listFraudSignals(campaignId) : Promise.resolve([]),
    campaignId ? listInvalidatedNominations(campaignId) : Promise.resolve([]),
    campaignId ? getCategoryActivity(campaignId) : Promise.resolve([]),
  ]);

  const exportCsv = tab === "export" && campaignId ? await exportNominationsCsv(campaignId) : "";

  const queryBase = new URLSearchParams();
  if (communityId) queryBase.set("communityId", communityId);
  if (campaignId) queryBase.set("campaignId", campaignId);

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Nominations"
        description="Overview, moderation queues, fraud signals, invalidations, category activity, and CSV export. Voting is not enabled yet."
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
        <button
          type="submit"
          className="h-9 rounded-lg border border-border px-3 text-sm hover:bg-muted"
        >
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
              href={toRoute(`/admin/nominations?${qs.toString()}`)}
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
        {tab === "overview" ? (
          nominations.length ? (
            nominations.map((nomination) => (
              <article
                key={nomination.id}
                className="grid gap-4 rounded-3xl border border-border/80 bg-card p-5 lg:grid-cols-[1.4fr_1fr]"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{nomination.id}</p>
                  <p>Status: {nomination.status}</p>
                  <p>Category: {nomination.campaignCategoryId}</p>
                  <p>Location: {nomination.businessLocationId ?? "—"}</p>
                  <p>User: {nomination.userId}</p>
                  <p>Created: {new Date(nomination.createdAt).toLocaleString()}</p>
                </div>
                {nomination.status !== "invalidated" ? (
                  <InvalidateNominationForm nominationId={nomination.id} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Invalidated: {nomination.invalidationReason}
                  </p>
                )}
              </article>
            ))
          ) : (
            <EmptyState
              title="No nominations"
              description="Select a campaign or wait for submissions."
            />
          )
        ) : null}

        {tab === "missing" ? (
          missing.length ? (
            missing.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-border/80 bg-card p-5 text-sm"
              >
                <p className="font-medium">{item.businessName}</p>
                <p>Nomination: {item.id}</p>
                <p>Status: {item.status} (awaits business moderation)</p>
                <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
              </article>
            ))
          ) : (
            <EmptyState
              title="Missing-business queue empty"
              description="Suggested businesses linked to pending nominations appear here."
            />
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
                  <p className="text-muted-foreground">
                    Metadata is privacy-conscious (hashed identifiers only).
                  </p>
                </div>
                {signal.status === "open" ? (
                  <ReviewFraudSignalForm signalId={signal.id} />
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              title="No fraud flags"
              description="Signals are recorded when rules fail."
            />
          )
        ) : null}

        {tab === "invalidations" ? (
          invalidated.length ? (
            invalidated.map((nomination) => (
              <article
                key={nomination.id}
                className="rounded-3xl border border-border/80 bg-card p-5 text-sm"
              >
                <p className="font-medium">{nomination.id}</p>
                <p>Reason: {nomination.invalidationReason}</p>
                <p>By: {nomination.invalidatedBy}</p>
                <p>At: {nomination.invalidatedAt}</p>
              </article>
            ))
          ) : (
            <EmptyState
              title="No invalidations"
              description="Invalidated nominations retain full history."
            />
          )
        ) : null}

        {tab === "activity" ? (
          activity.length ? (
            <div className="overflow-x-auto rounded-3xl border border-border/80">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3">Category ID</th>
                    <th className="px-4 py-3">Valid</th>
                    <th className="px-4 py-3">Pending</th>
                    <th className="px-4 py-3">Invalidated</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row) => (
                    <tr key={row.campaignCategoryId} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{row.campaignCategoryId}</td>
                      <td className="px-4 py-3">{row.validCount}</td>
                      <td className="px-4 py-3">{row.pendingCount}</td>
                      <td className="px-4 py-3">{row.invalidatedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No category activity"
              description="Counts appear after nominations."
            />
          )
        ) : null}

        {tab === "export" ? (
          campaignId ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Admin-only CSV for campaign {campaignId}. Public surfaces never expose exact totals.
              </p>
              <pre className="max-h-[480px] overflow-auto rounded-3xl border border-border/80 bg-card p-4 text-xs">
                {exportCsv}
              </pre>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(exportCsv)}`}
                download={`nominations-${campaignId}.csv`}
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
              >
                Download CSV
              </a>
            </div>
          ) : (
            <EmptyState title="Select a campaign" description="Choose a campaign to export." />
          )
        ) : null}
      </div>
    </PageShell>
  );
}
