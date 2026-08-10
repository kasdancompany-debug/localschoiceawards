import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminFraudForm, AdminRefundForm } from "@/components/admin/order-admin-forms";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import {
  getOrderById,
  listPaymentsForOrder,
  listRefundsForOrder,
} from "@/lib/orders/queries";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ orderId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return { title: `Order ${orderId.slice(0, 8)}` };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdminSession("/admin/orders");
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) {
    notFound();
  }

  const [payments, refunds] = await Promise.all([
    listPaymentsForOrder(order.id),
    listRefundsForOrder(order.id),
  ]);
  const refunded = refunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((sum, refund) => sum + refund.amountCents, 0);
  const paidAmount = payments.find((payment) => payment.status === "succeeded")?.amountCents ?? 0;
  const refundable = Math.max(0, paidAmount - refunded);

  const shipping = order.shippingAddressSnapshot as Record<string, unknown>;
  const billing = order.billingAddressSnapshot as Record<string, unknown>;

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow="Admin order"
          title={order.orderNumber}
          description="Customer information, payment status, refund action, fraud flags, and fulfillment state."
        />
        <Link href={toRoute("/admin/orders")} className={cn(buttonVariants({ variant: "outline" }))}>
          All orders
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="space-y-4 text-sm">
          <h2 className="font-heading text-xl font-semibold">Customer</h2>
          <p>{order.customerEmail}</p>
          <p>User ID: {order.userId}</p>
          <p>Business ID: {order.businessId ?? "—"}</p>
          <h3 className="pt-2 font-medium">Shipping address</h3>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
            {JSON.stringify(shipping, null, 2)}
          </pre>
          <h3 className="font-medium">Billing address</h3>
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
            {JSON.stringify(billing, null, 2)}
          </pre>
        </section>

        <section className="space-y-4 text-sm">
          <h2 className="font-heading text-xl font-semibold">Payment status</h2>
          <p>Order status: {order.status}</p>
          <p>Payment: {order.paymentStatus}</p>
          <p>Fulfillment: {order.fulfillmentStatus}</p>
          <p>Subtotal: {formatMoney(order.subtotalCents, order.currencyCode)}</p>
          <p>Shipping: {formatMoney(order.shippingCents, order.currencyCode)}</p>
          <p>Tax: {formatMoney(order.taxCents, order.currencyCode)}</p>
          <p className="font-semibold">Total: {formatMoney(order.totalCents, order.currencyCode)}</p>
          <p>Stripe session: {order.stripeCheckoutSessionId ?? "—"}</p>
          <p>Payment intent: {order.stripePaymentIntentId ?? "—"}</p>
        </section>
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold">Items</h2>
        {order.items.map((item) => (
          <article key={item.id} className="border-b border-border/70 pb-3 text-sm">
            <p className="font-medium">
              {item.productNameSnapshot} · {item.variantNameSnapshot}
            </p>
            <p className="text-muted-foreground">
              {item.skuSnapshot} · Qty {item.quantity} ·{" "}
              {formatMoney(item.unitPriceCents * item.quantity, order.currencyCode)}
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
              {JSON.stringify(item.personalizationSnapshot, null, 2)}
            </pre>
          </article>
        ))}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Refund action</h2>
          {refundable > 0 ? (
            <AdminRefundForm orderId={order.id} maxAmountCents={refundable} />
          ) : (
            <p className="text-sm text-muted-foreground">No refundable balance.</p>
          )}
          {refunds.length ? (
            <ul className="space-y-1 text-sm">
              {refunds.map((refund) => (
                <li key={refund.id}>
                  {refund.status} · {formatMoney(refund.amountCents, order.currencyCode)} ·{" "}
                  {refund.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Fraud flags</h2>
          <AdminFraudForm
            orderId={order.id}
            initialFlags={order.fraudFlags}
            initialNotes={order.fraudNotes}
          />
        </section>
      </div>
    </PageShell>
  );
}
