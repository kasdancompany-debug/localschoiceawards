import { EmptyState } from "@/components/empty-state";
import { SupplierSectionNav } from "@/components/supplier/supplier-section-nav";
import { formatMoney } from "@/lib/commerce/rules";
import { listSupplierProducts } from "@/lib/fulfillment/service";
import { resolveSupplierContext } from "@/lib/fulfillment/supplier-context";

export default async function SupplierProductsPage() {
  const { primarySupplierId } = await resolveSupplierContext();
  const products = primarySupplierId
    ? await listSupplierProducts(primarySupplierId)
    : [];

  return (
    <div className="space-y-6">
      <SupplierSectionNav current="/supplier/products" />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Product mappings</h1>
      {products.length ? (
        <ul className="space-y-3 text-sm">
          {products.map((product) => (
            <li key={product.id} className="border-b border-border/70 pb-3">
              <p className="font-medium">{product.supplierSku}</p>
              <p className="text-muted-foreground">
                Variant {product.productVariantId.slice(0, 8)} · Manufacturing{" "}
                {formatMoney(product.manufacturingCostCents, product.supplierCurrencyCode)} · Setup{" "}
                {formatMoney(product.setupCostCents, product.supplierCurrencyCode)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No mappings" description="Ask admin to configure supplier products." />
      )}
    </div>
  );
}
