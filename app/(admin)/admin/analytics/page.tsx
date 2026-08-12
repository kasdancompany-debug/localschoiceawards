import Link from "next/link";

import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import { MetricStat } from "@/components/analytics/metric-stat";
import { SimpleBars } from "@/components/analytics/simple-bars";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminAnalyticsDashboard } from "@/lib/analytics/admin-reports";
import { parseDateRange } from "@/lib/analytics/rules";
import { requireAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { createSupabaseAdminClient } from "@/lib/database";
import { toRoute } from "@/lib/routes";

type Props = {
  searchParams: Promise<{ from?: string; to?: string; communityId?: string }>;
};

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const session = await requireAdminSession("/admin/analytics");
  const query = await searchParams;
  const range = parseDateRange(query);
  const communityId = query.communityId || null;

  const dashboard = await getAdminAnalyticsDashboard({
    actor: { kind: "admin", userId: session.userId },
    from: range.from,
    to: range.to,
    communityId,
  });

  if (!dashboard) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: communities } = await admin
    .from("communities")
    .select("id, name")
    .eq("is_public", true)
    .order("name")
    .limit(200);

  const exportHref = toRoute(
    `/admin/analytics/export?from=${range.from}&to=${range.to}${
      communityId ? `&communityId=${communityId}` : ""
    }`,
  );

  const k = dashboard.kpis;
  const campaignStageRows = Object.entries(k.campaignsByStage).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow="Admin"
          title="Analytics & financials"
          description="Privacy-conscious platform KPIs, funnel conversion, and contribution margin. Business dashboards never receive individual voter choices."
        />
        <Link href={exportHref} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Export CSV
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <DateRangeFilter from={range.from} to={range.to} />
        <form method="get" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="from" value={range.from} />
          <input type="hidden" name="to" value={range.to} />
          <label className="space-y-1 text-sm">
            <span className="block text-muted-foreground">Community</span>
            <select
              name="communityId"
              defaultValue={communityId ?? ""}
              className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
            >
              <option value="">All communities</option>
              {(communities ?? []).map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="h-8 rounded-lg border border-border px-3 text-sm">
            Compare
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat label="Active communities" value={String(k.activeCommunities)} />
        <MetricStat label="Businesses listed" value={String(k.businessesListed)} />
        <MetricStat
          label="Claimed businesses"
          value={String(k.claimedBusinesses)}
          hint="Primary ownership KPI"
        />
        <MetricStat label="Campaigns completed" value={String(k.campaignsCompleted)} />
        <MetricStat label="Registered users" value={String(k.registeredUsers)} />
        <MetricStat label="Nominators" value={String(k.nominators)} />
        <MetricStat label="Voters" value={String(k.voters)} />
        <MetricStat label="Votes" value={String(k.votes)} />
        <MetricStat label="Winner businesses" value={String(k.winnerBusinesses)} />
        <MetricStat label="Buyers" value={String(k.buyers)} />
        <MetricStat
          label="Product conversion"
          value={`${k.productConversionRate.toFixed(1)}%`}
          hint="Buyers / winners"
        />
        <MetricStat
          label="Average order value"
          value={formatMoney(k.averageOrderValueCents, "CAD")}
        />
      </div>

      <div className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat label="Revenue" value={formatMoney(k.revenueCents, "CAD")} />
        <MetricStat
          label="Manufacturing cost"
          value={formatMoney(k.manufacturingCostCents, "CAD")}
        />
        <MetricStat
          label="Shipping collected"
          value={formatMoney(k.shippingCollectedCents, "CAD")}
        />
        <MetricStat
          label="Supplier shipping cost"
          value={formatMoney(k.supplierShippingCostCents, "CAD")}
        />
        <MetricStat
          label="Shipping margin"
          value={formatMoney(k.shippingMarginCents, "CAD")}
        />
        <MetricStat label="Stripe fees" value={formatMoney(k.stripeFeesCents, "CAD")} />
        <MetricStat label="Refunds" value={formatMoney(k.refundsCents, "CAD")} />
        <MetricStat
          label="Gross contribution"
          value={formatMoney(k.grossContributionCents, "CAD")}
        />
        <MetricStat
          label="Email conversion"
          value={`${k.emailConversionRate.toFixed(1)}%`}
          hint={`${k.emailClicked} clicks / ${k.emailDelivered} delivered`}
        />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-xl font-semibold">Campaigns by stage</h2>
          <div className="mt-4">
            {campaignStageRows.length ? (
              <SimpleBars rows={campaignStageRows} />
            ) : (
              <EmptyState className="border-0 py-6" title="No campaigns" description="" />
            )}
          </div>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold">Funnel conversion</h2>
          <div className="mt-4">
            <SimpleBars
              rows={dashboard.funnel.map((step) => ({
                label: step.step.replace("funnel.", ""),
                value: step.count,
              }))}
            />
          </div>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold">Contribution by community</h2>
        <div className="mt-4">
          {dashboard.contributionByCommunity.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Community</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.contributionByCommunity.map((row) => (
                  <TableRow key={row.communityId}>
                    <TableCell>{row.communityName}</TableCell>
                    <TableCell>{row.orders}</TableCell>
                    <TableCell>{formatMoney(row.revenueCents, "CAD")}</TableCell>
                    <TableCell>{formatMoney(row.contributionCents, "CAD")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              className="border-0 py-8"
              title="No community revenue yet"
              description="Paid orders appear here once checkout webhooks succeed."
            />
          )}
        </div>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-xl font-semibold">Contribution by product</h2>
          <div className="mt-4">
            {dashboard.contributionByProduct.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.contributionByProduct.map((row) => (
                    <TableRow key={row.productId}>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>{row.units}</TableCell>
                      <TableCell>{formatMoney(row.revenueCents, "CAD")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState className="border-0 py-8" title="No product sales" description="" />
            )}
          </div>
        </section>
        <section>
          <h2 className="font-heading text-xl font-semibold">Supplier performance</h2>
          <div className="mt-4">
            {dashboard.supplierPerformance.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Mfg cost</TableHead>
                    <TableHead>Ship cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.supplierPerformance.map((row) => (
                    <TableRow key={row.supplierId}>
                      <TableCell>{row.supplierName}</TableCell>
                      <TableCell>{row.fulfillments}</TableCell>
                      <TableCell>{formatMoney(row.manufacturingCostCents, "CAD")}</TableCell>
                      <TableCell>{formatMoney(row.supplierShippingCostCents, "CAD")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState className="border-0 py-8" title="No supplier jobs" description="" />
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
