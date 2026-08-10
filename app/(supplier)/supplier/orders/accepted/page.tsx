import { ACCEPTED_STATUSES } from "@/lib/fulfillment/rules";
import { SupplierOrdersListPage } from "@/components/supplier/orders-list-page";

export default async function SupplierAcceptedOrdersPage() {
  return (
    <SupplierOrdersListPage
      title="Accepted"
      current="/supplier/orders/accepted"
      statuses={ACCEPTED_STATUSES}
    />
  );
}
