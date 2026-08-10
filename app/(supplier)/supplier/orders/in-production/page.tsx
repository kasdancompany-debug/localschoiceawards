import { IN_PRODUCTION_STATUSES } from "@/lib/fulfillment/rules";
import { SupplierOrdersListPage } from "@/components/supplier/orders-list-page";

export default async function SupplierInProductionPage() {
  return (
    <SupplierOrdersListPage
      title="In production"
      current="/supplier/orders/in-production"
      statuses={IN_PRODUCTION_STATUSES}
    />
  );
}
