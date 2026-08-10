import { READY_TO_SHIP_STATUSES } from "@/lib/fulfillment/rules";
import { SupplierOrdersListPage } from "@/components/supplier/orders-list-page";

export default async function SupplierReadyToShipPage() {
  return (
    <SupplierOrdersListPage
      title="Ready to ship"
      current="/supplier/orders/ready-to-ship"
      statuses={READY_TO_SHIP_STATUSES}
    />
  );
}
