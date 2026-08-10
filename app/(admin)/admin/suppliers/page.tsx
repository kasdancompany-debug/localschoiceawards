import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";
import { listAllSuppliers } from "@/lib/fulfillment/service";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function AdminSuppliersPage() {
  await requireAdminSession("/admin/suppliers");
  const suppliers = await listAllSuppliers();

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Suppliers"
        description="Canadian and US suppliers for drop-ship personalization. Stripe Connect payouts are recorded as unpaid/pending for a later phase."
      />
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href={toRoute("/admin/supplier-products")} className="underline-offset-4 hover:underline">
          Products / costs
        </Link>
        <Link href={toRoute("/admin/supplier-shipping")} className="underline-offset-4 hover:underline">
          Shipping rates
        </Link>
        <Link href={toRoute("/admin/fulfillment")} className="underline-offset-4 hover:underline">
          Fulfillment queue
        </Link>
      </div>
      <div className="mt-10 space-y-4">
        {suppliers.length ? (
          suppliers.map((supplier) => (
            <article key={supplier.id} className="border-b border-border/70 pb-4 text-sm">
              <h2 className="font-heading text-xl font-semibold">{supplier.name}</h2>
              <p className="text-muted-foreground">
                {supplier.countryCode} · {supplier.currencyCode} · {supplier.fulfillmentMethod} ·{" "}
                {supplier.active ? "active" : "inactive"}
              </p>
              <p>
                Contact: {supplier.contactEmail} · Support: {supplier.supportEmail || "—"}
              </p>
              <p>
                Production {supplier.productionMinDays}–{supplier.productionMaxDays} days · Connect
                account: {supplier.stripeConnectedAccountId ?? "not configured"}
              </p>
            </article>
          ))
        ) : (
          <EmptyState title="No suppliers" description="Seed suppliers via migration." />
        )}
      </div>
      <Link href={toRoute("/admin/supplier-performance")} className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
        Supplier performance
      </Link>
    </PageShell>
  );
}
