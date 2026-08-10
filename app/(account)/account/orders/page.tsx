import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { listOrdersForUser } from "@/lib/orders/queries";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  description: "Your Locals Choice Awards order history.",
};

export default async function AccountOrdersPage() {
  const session = await requireUser({ next: "/account/orders" });
  const orders = await listOrdersForUser(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-2 text-muted-foreground">
          Award product purchases. Payment status reflects verified Stripe webhooks.
        </p>
      </div>

      {orders.length ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4"
            >
              <div className="text-sm">
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()} · {order.paymentStatus} ·{" "}
                  {formatMoney(order.totalCents, order.currencyCode)}
                </p>
              </div>
              <Link
                href={toRoute(`/account/orders/${order.id}`)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No orders yet"
          description="When you purchase recognition products, they appear here."
        />
      )}
    </div>
  );
}
