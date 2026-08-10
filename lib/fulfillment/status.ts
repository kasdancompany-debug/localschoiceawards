export type FulfillmentOrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type FulfillmentOrder = {
  id: string;
  status: FulfillmentOrderStatus;
  trackingNumber?: string;
};

export function getFulfillmentStatusLabel(status: FulfillmentOrderStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
