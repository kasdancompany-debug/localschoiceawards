import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { listOrdersForAdmin } from "@/lib/orders/queries";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentStatus?: string }>;
}) {
  await requireAdminSession("/admin/orders");
  const params = await searchParams;
  const orders = await listOrdersForAdmin({
    paymentStatus: params.paymentStatus,
    limit: 100,
  });

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow="Admin"
          title="Orders"
          description="Payment status, fulfillment, customer information, fraud flags, and refunds. Export includes the current filtered list."
        />
        <Link
          href={toRoute(
            `/admin/orders/export${params.paymentStatus ? `?paymentStatus=${params.paymentStatus}` : ""}`,
          )}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Export CSV
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href={toRoute("/admin/orders")} className="underline-offset-4 hover:underline">
          All
        </Link>
        {["pending", "paid", "failed", "refunded", "partially_refunded"].map((status) => (
          <Link
            key={status}
            href={toRoute(`/admin/orders?paymentStatus=${status}`)}
            className="underline-offset-4 hover:underline"
          >
            {status}
          </Link>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        {orders.length ? (
          orders.map((order) => (
            <article
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4"
            >
              <div className="text-sm">
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-muted-foreground">
                  {order.customerEmail} · {order.paymentStatus} · {order.fulfillmentStatus} ·{" "}
                  {formatMoney(order.totalCents, order.currencyCode)}
                </p>
                {order.fraudFlags.length ? (
                  <p className="text-destructive">Flags: {order.fraudFlags.join(", ")}</p>
                ) : null}
              </div>
              <Link
                href={toRoute(`/admin/orders/${order.id}`)}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Details
              </Link>
            </article>
          ))
        ) : (
          <EmptyState title="No orders" description="Checkout orders appear here after creation." />
        )}
      </div>
    </PageShell>
  );
}
