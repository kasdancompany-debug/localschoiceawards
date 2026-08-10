import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { listAllSuppliers, listSupplierProducts } from "@/lib/fulfillment/service";

export default async function AdminSupplierProductsPage() {
  await requireAdminSession("/admin/supplier-products");
  const [suppliers, products] = await Promise.all([listAllSuppliers(), listSupplierProducts()]);
  const nameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Supplier products & cost mappings"
        description="Manufacturing and setup costs by supplier SKU. Used for routing and margin reports."
      />
      <div className="mt-10 space-y-4">
        {products.length ? (
          products.map((product) => (
            <article key={product.id} className="border-b border-border/70 pb-3 text-sm">
              <p className="font-medium">
                {nameById.get(product.supplierId) ?? product.supplierId} · {product.supplierSku}
              </p>
              <p className="text-muted-foreground">
                Variant {product.productVariantId} · Mfg{" "}
                {formatMoney(product.manufacturingCostCents, product.supplierCurrencyCode)} · Setup{" "}
                {formatMoney(product.setupCostCents, product.supplierCurrencyCode)} ·{" "}
                {product.active ? "active" : "inactive"}
              </p>
            </article>
          ))
        ) : (
          <EmptyState title="No cost mappings" description="Seed supplier_products first." />
        )}
      </div>
    </PageShell>
  );
}
