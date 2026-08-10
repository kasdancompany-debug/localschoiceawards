import Link from "next/link";

import { AdminRemakeForm } from "@/components/admin/remake-form";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { listAllSuppliers, listFulfillmentsForAdmin } from "@/lib/fulfillment/service";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function AdminFulfillmentQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ failed?: string }>;
}) {
  await requireAdminSession("/admin/fulfillment");
  const params = await searchParams;
  const [fulfillments, suppliers] = await Promise.all([
    listFulfillmentsForAdmin({ failedOnly: params.failed === "1" }),
    listAllSuppliers(),
  ]);
  const nameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow="Admin"
          title={params.failed === "1" ? "Failed submissions" : "Fulfillment queue"}
          description="Paid orders routed to suppliers. Submission is idempotent — duplicates are blocked."
        />
        <div className="flex gap-2">
          <Link href={toRoute("/admin/fulfillment")} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            All
          </Link>
          <Link
            href={toRoute("/admin/fulfillment?failed=1")}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Failed
          </Link>
          <Link href={toRoute("/admin/margins")} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Margins
          </Link>
          <Link href={toRoute("/admin/remakes")} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Remakes
          </Link>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        {fulfillments.length ? (
          fulfillments.map((item) => (
            <article key={item.id} className="space-y-3 border-b border-border/70 pb-5">
              <div className="text-sm">
                <p className="font-medium">
                  {item.supplierOrderReference ?? item.id.slice(0, 8)} · {item.status}
                </p>
                <p className="text-muted-foreground">
                  {nameById.get(item.supplierId) ?? item.supplierId} ·{" "}
                  {item.destinationCountryCode ?? "—"} · Mfg{" "}
                  {formatMoney(item.manufacturingCostCents, "CAD")} · Ship cost{" "}
                  {formatMoney(item.supplierShippingCostCents, "CAD")} · Supplier payment{" "}
                  {item.supplierPaymentStatus}
                </p>
              </div>
              <AdminRemakeForm fulfillmentId={item.id} />
            </article>
          ))
        ) : (
          <EmptyState title="Queue empty" description="Paid orders appear here after routing." />
        )}
      </div>
    </PageShell>
  );
}
