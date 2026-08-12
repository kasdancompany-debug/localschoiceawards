import Link from "next/link";
import { notFound } from "next/navigation";

import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import { MetricStat } from "@/components/analytics/metric-stat";
import { SimpleBars } from "@/components/analytics/simple-bars";
import { BusinessSectionNav } from "@/components/businesses/business-section-nav";
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
import { getBusinessAnalytics } from "@/lib/analytics/business-reports";
import { parseDateRange } from "@/lib/analytics/rules";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  listMembershipsForUser,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";
import { formatMoney } from "@/lib/commerce/rules";
import { toRoute } from "@/lib/routes";

type Props = {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function BusinessAnalyticsPage({ params, searchParams }: Props) {
  const session = await requireUser({ next: "/businesses" });
  const { businessId } = await params;
  const query = await searchParams;

  try {
    await requireBusinessMembership(businessId, session.userId);
  } catch {
    notFound();
  }

  const memberships = await listMembershipsForUser(session.userId);
  const business = await getManagedBusiness(businessId);
  if (!business) notFound();

  const range = parseDateRange(query);
  const summary = await getBusinessAnalytics({
    actor: {
      kind: "business_member",
      userId: session.userId,
      businessIds: memberships.map((m) => m.businessId),
    },
    businessId,
    from: range.from,
    to: range.to,
  });

  if (!summary) notFound();

  const exportHref = toRoute(
    `/businesses/${businessId}/analytics/export?from=${range.from}&to=${range.to}`,
  );

  return (
    <PageShell>
      <BusinessSectionNav businessId={businessId} current="analytics" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow={business.public_name}
          title="Analytics"
          description="Aggregated profile engagement only. Individual voter choices are never shown."
        />
        <Link href={exportHref} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Export CSV
        </Link>
      </div>

      <div className="mt-6">
        <DateRangeFilter from={range.from} to={range.to} />
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat label="Profile views" value={String(summary.profileViews)} />
        <MetricStat label="Website clicks" value={String(summary.websiteClicks)} />
        <MetricStat label="Phone clicks" value={String(summary.phoneClicks)} />
        <MetricStat label="Direction clicks" value={String(summary.directionClicks)} />
        <MetricStat label="Nomination visits" value={String(summary.nominationPageVisits)} />
        <MetricStat label="Voting visits" value={String(summary.votingPageVisits)} />
        <MetricStat label="Asset downloads" value={String(summary.assetDownloads)} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-heading text-xl font-semibold">Daily engagement</h2>
          <div className="mt-4">
            {summary.series.length ? (
              <SimpleBars
                rows={summary.series.map((day) => ({
                  label: day.date,
                  value: day.profileViews + day.websiteClicks + day.phoneClicks,
                }))}
              />
            ) : (
              <EmptyState
                className="border-0 py-8"
                title="No engagement yet"
                description="Views and clicks appear here after visitors interact with your public profile."
              />
            )}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-semibold">Award order history</h2>
          <div className="mt-4">
            {summary.orders.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.orders.map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        {formatMoney(order.totalCents, order.currencyCode)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.placedAt ? new Date(order.placedAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                className="border-0 py-8"
                title="No award orders"
                description="Orders tied to your award eligibility appear here."
              />
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
