import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { getSupplierPerformance } from "@/lib/fulfillment/service";

export default async function AdminSupplierPerformancePage() {
  await requireAdminSession("/admin/supplier-performance");
  const rows = await getSupplierPerformance();

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Supplier performance"
        description="Volume, ship rate, rejects, and failed submissions by supplier."
      />
      <div className="mt-10 space-y-4">
        {rows.length ? (
          rows.map((row) => (
            <article key={row.supplier.id} className="border-b border-border/70 pb-3 text-sm">
              <p className="font-medium">{row.supplier.name}</p>
              <p className="text-muted-foreground">
                Total {row.total} · Shipped {row.shipped} ({(row.shipRate * 100).toFixed(0)}%) ·
                Rejected {row.rejected} · Failed submissions {row.failed}
              </p>
            </article>
          ))
        ) : (
          <EmptyState title="No suppliers" description="Seed suppliers to see performance." />
        )}
      </div>
    </PageShell>
  );
}
