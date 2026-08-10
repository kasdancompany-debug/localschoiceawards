import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { buildMarginReports } from "@/lib/fulfillment/service";

export default async function AdminMarginsPage() {
  await requireAdminSession("/admin/margins");
  const reports = await buildMarginReports(100);

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Margin reports"
        description="Platform gross margin per order using customer merchandise + shipping revenue minus recorded supplier manufacturing and shipping costs."
      />
      <div className="mt-10 space-y-4">
        {reports.length ? (
          reports.map((report) => (
            <article key={report.orderId} className="border-b border-border/70 pb-3 text-sm">
              <p className="font-medium">{report.orderNumber}</p>
              <p className="text-muted-foreground">
                Revenue {formatMoney(report.customerRevenueCents, report.currencyCode)} · Cost{" "}
                {formatMoney(report.supplierCostCents, report.currencyCode)} · Margin{" "}
                {formatMoney(report.grossMarginCents, report.currencyCode)} (
                {report.grossMarginPercent.toFixed(1)}%)
              </p>
            </article>
          ))
        ) : (
          <EmptyState title="No margin data" description="Fulfillments generate margin rows." />
        )}
      </div>
    </PageShell>
  );
}
