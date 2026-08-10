import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { getOrderForUser } from "@/lib/orders/checkout";
import { listPaymentsForOrder, listRefundsForOrder } from "@/lib/orders/queries";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ orderId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  return { title: `Order ${orderId.slice(0, 8)}` };
}

export default async function AccountOrderDetailPage({ params }: Props) {
  const session = await requireUser({ next: "/account/orders" });
  const { orderId } = await params;
  const order = await getOrderForUser({ orderId, userId: session.userId });
  if (!order) {
    notFound();
  }

  const [payments, refunds] = await Promise.all([
    listPaymentsForOrder(order.id),
    listRefundsForOrder(order.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Placed {order.placedAt ? new Date(order.placedAt).toLocaleString() : "pending confirmation"}
          </p>
        </div>
        <Link
          href={toRoute(`/account/orders/${order.id}/receipt`)}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Printable receipt
        </Link>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Payment status</dt>
          <dd className="font-medium">{order.paymentStatus}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fulfillment</dt>
          <dd className="font-medium">{order.fulfillmentStatus}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Merchandise</dt>
          <dd>{formatMoney(order.subtotalCents, order.currencyCode)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Shipping</dt>
          <dd>{formatMoney(order.shippingCents, order.currencyCode)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tax</dt>
          <dd>{formatMoney(order.taxCents, order.currencyCode)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold">{formatMoney(order.totalCents, order.currencyCode)}</dd>
        </div>
      </dl>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Items</h2>
        {order.items.map((item) => {
          const snap = item.personalizationSnapshot as {
            businessName?: string;
            categoryName?: string;
            placement?: string;
          };
          return (
            <article key={item.id} className="border-b border-border/70 pb-3 text-sm">
              <p className="font-medium">
                {item.productNameSnapshot} · {item.variantNameSnapshot}
              </p>
              <p className="text-muted-foreground">
                SKU {item.skuSnapshot} · Qty {item.quantity} ·{" "}
                {formatMoney(item.unitPriceCents * item.quantity, order.currencyCode)}
              </p>
              {snap.businessName ? (
                <p className="mt-1 text-muted-foreground">
                  Personalized: {snap.businessName}
                  {snap.placement ? ` · ${snap.placement}` : ""}
                  {snap.categoryName ? ` · ${snap.categoryName}` : ""}
                </p>
              ) : null}
            </article>
          );
        })}
      </section>

      {payments.length ? (
        <section className="space-y-2 text-sm">
          <h2 className="font-heading text-xl font-semibold">Payments</h2>
          {payments.map((payment) => (
            <p key={payment.id}>
              {payment.status} · {formatMoney(payment.amountCents, payment.currencyCode)} ·{" "}
              {payment.providerPaymentId}
            </p>
          ))}
        </section>
      ) : null}

      {refunds.length ? (
        <section className="space-y-2 text-sm">
          <h2 className="font-heading text-xl font-semibold">Refunds</h2>
          {refunds.map((refund) => (
            <p key={refund.id}>
              {refund.status} · {formatMoney(refund.amountCents, order.currencyCode)} ·{" "}
              {refund.reason || "No reason listed"}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
