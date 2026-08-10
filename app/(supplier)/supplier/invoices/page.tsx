import { EmptyState } from "@/components/empty-state";
import { SupplierSectionNav } from "@/components/supplier/supplier-section-nav";
import { formatMoney } from "@/lib/commerce/rules";
import { listSupplierInvoices } from "@/lib/fulfillment/service";
import { resolveSupplierContext } from "@/lib/fulfillment/supplier-context";

export default async function SupplierInvoicesPage() {
  const { primarySupplierId, suppliers } = await resolveSupplierContext();
  const invoices = primarySupplierId
    ? await listSupplierInvoices(primarySupplierId)
    : [];
  const currency = suppliers[0]?.currencyCode ?? "CAD";

  return (
    <div className="space-y-6">
      <SupplierSectionNav current="/supplier/invoices" />
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-2 text-muted-foreground">
          Supplier amounts and payment status are recorded for future Stripe Connect payouts.
        </p>
      </div>
      {invoices.length ? (
        <ul className="space-y-3 text-sm">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="border-b border-border/70 pb-3">
              <p className="font-medium">{invoice.invoice_number}</p>
              <p className="text-muted-foreground">
                {invoice.status} ·{" "}
                {formatMoney(invoice.amount_cents, (invoice.currency_code as "CAD" | "USD") || currency)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No invoices yet"
          description="Invoices appear after fulfillments are completed and billed."
        />
      )}
    </div>
  );
}
