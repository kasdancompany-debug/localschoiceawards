import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/orders/print-button";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import { getOrderForUser } from "@/lib/orders/checkout";

type Props = { params: Promise<{ orderId: string }> };

export const metadata: Metadata = {
  title: "Receipt",
};

export default async function OrderReceiptPage({ params }: Props) {
  const session = await requireUser({ next: "/account/orders" });
  const { orderId } = await params;
  const order = await getOrderForUser({ orderId, userId: session.userId });
  if (!order) {
    notFound();
  }

  const method = order.shippingMethodSnapshot as { methodName?: string };

  return (
    <div className="mx-auto max-w-2xl bg-white px-6 py-10 text-black print:max-w-none">
      <header className="space-y-1 border-b border-black/20 pb-4">
        <p className="text-sm uppercase tracking-[0.16em]">Locals Choice Awards</p>
        <h1 className="font-heading text-3xl font-semibold">Receipt</h1>
        <p className="text-sm">Order {order.orderNumber}</p>
        <p className="text-sm">{order.customerEmail}</p>
        <p className="text-sm">
          {order.placedAt
            ? new Date(order.placedAt).toLocaleString()
            : `Created ${new Date(order.createdAt).toLocaleString()}`}
        </p>
      </header>

      <section className="mt-6 space-y-3 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4">
            <div>
              <p className="font-medium">
                {item.productNameSnapshot} × {item.quantity}
              </p>
              <p>{item.skuSnapshot}</p>
            </div>
            <p>{formatMoney(item.unitPriceCents * item.quantity, order.currencyCode)}</p>
          </div>
        ))}
      </section>

      <dl className="mt-8 space-y-2 border-t border-black/20 pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Merchandise subtotal</dt>
          <dd>{formatMoney(order.subtotalCents, order.currencyCode)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Shipping{method.methodName ? ` (${method.methodName})` : ""}</dt>
          <dd>{formatMoney(order.shippingCents, order.currencyCode)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Tax</dt>
          <dd>{formatMoney(order.taxCents, order.currencyCode)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatMoney(order.totalCents, order.currencyCode)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Payment status</dt>
          <dd>{order.paymentStatus}</dd>
        </div>
      </dl>

      <p className="mt-8 text-xs text-black/60">
        Payment confirmation is verified by Stripe webhooks. This receipt reflects server order
        state.
      </p>
      <PrintButton />
    </div>
  );
}
