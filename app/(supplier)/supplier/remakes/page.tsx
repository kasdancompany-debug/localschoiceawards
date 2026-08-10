import { REMAKE_STATUSES } from "@/lib/fulfillment/rules";
import { SupplierOrdersListPage } from "@/components/supplier/orders-list-page";

export default async function SupplierRemakesPage() {
  return (
    <SupplierOrdersListPage
      title="Remakes"
      current="/supplier/remakes"
      statuses={REMAKE_STATUSES}
    />
  );
}
