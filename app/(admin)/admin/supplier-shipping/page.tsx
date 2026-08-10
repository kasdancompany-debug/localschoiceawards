import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { listAllSuppliers, listSupplierShippingRates } from "@/lib/fulfillment/service";

export default async function AdminSupplierShippingPage() {
  await requireAdminSession("/admin/supplier-shipping");
  const [suppliers, rates] = await Promise.all([
    listAllSuppliers(),
    listSupplierShippingRates(),
  ]);
  const nameById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Supplier shipping rates"
        description="Supplier cost versus customer charge by zone. Helps calculate platform margin."
      />
      <div className="mt-10 space-y-4">
        {rates.length ? (
          rates.map((rate) => {
            const supplier = nameById.get(rate.supplier_id);
            return (
              <article key={rate.id} className="border-b border-border/70 pb-3 text-sm">
                <p className="font-medium">
                  {supplier?.name ?? rate.supplier_id} · {rate.shipping_method_name}
                </p>
                <p className="text-muted-foreground">
                  Zone {rate.shipping_zone_id.slice(0, 8)} · Supplier cost{" "}
                  {formatMoney(rate.supplier_cost_cents, supplier?.currencyCode ?? "CAD")} ·
                  Customer charge{" "}
                  {formatMoney(rate.customer_charge_cents, supplier?.currencyCode ?? "CAD")} ·{" "}
                  {rate.estimated_min_days}–{rate.estimated_max_days} days
                </p>
              </article>
            );
          })
        ) : (
          <EmptyState title="No rates" description="Seed supplier_shipping_rates first." />
        )}
      </div>
    </PageShell>
  );
}
