import "server-only";

import { softEmitNotificationEvent } from "@/lib/notifications/emit";

/**
 * Supplier production alerts are operational emails to contracted suppliers
 * (not scraped directory addresses). Still goes through the notification queue.
 */
export async function sendSupplierOrderEmail(input: {
  to: string;
  supplierName: string;
  orderReference: string;
  method: "portal" | "email" | "api";
  itemSummaries: string[];
  fulfillmentId?: string;
}): Promise<void> {
  await softEmitNotificationEvent({
    eventType: "fulfillment.supplier_order",
    aggregateType: "fulfillment",
    aggregateId: input.fulfillmentId ?? input.orderReference,
    templateKey: "commerce.fulfillment_accepted",
    recipientEmail: input.to,
    recipientSource: "supplier",
    subjectVars: { orderNumber: input.orderReference },
    templateVars: {
      orderNumber: input.orderReference,
      supplierName: input.supplierName,
      method: input.method,
      notes: input.itemSummaries.join("\n"),
    },
  });
}

export async function sendCustomerTrackingEmail(input: {
  to: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  orderId?: string;
  userId?: string | null;
}): Promise<void> {
  await softEmitNotificationEvent({
    eventType: "commerce.order_shipped",
    aggregateType: "order",
    aggregateId: input.orderId ?? input.orderNumber,
    templateKey: "commerce.order_shipped",
    recipientEmail: input.to,
    userId: input.userId,
    recipientSource: "order_customer",
    subjectVars: { orderNumber: input.orderNumber },
    templateVars: {
      orderNumber: input.orderNumber,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      trackingUrl: input.trackingUrl ?? "",
    },
  });
}
