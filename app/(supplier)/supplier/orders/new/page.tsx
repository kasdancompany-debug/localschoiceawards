import { NEW_ORDER_STATUSES } from "@/lib/fulfillment/rules";
import { SupplierOrdersListPage } from "@/components/supplier/orders-list-page";

export default async function SupplierNewOrdersPage() {
  return (
    <SupplierOrdersListPage
      title="New orders"
      current="/supplier/orders/new"
      statuses={NEW_ORDER_STATUSES}
    />
  );
}
