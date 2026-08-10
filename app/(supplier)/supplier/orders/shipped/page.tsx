import { SHIPPED_STATUSES } from "@/lib/fulfillment/rules";
import { SupplierOrdersListPage } from "@/components/supplier/orders-list-page";

export default async function SupplierShippedPage() {
  return (
    <SupplierOrdersListPage
      title="Shipped"
      current="/supplier/orders/shipped"
      statuses={SHIPPED_STATUSES}
    />
  );
}
