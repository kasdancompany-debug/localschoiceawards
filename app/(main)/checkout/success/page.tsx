import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/commerce/rules";
import {
  getOrderByCheckoutSessionId,
  getOrderById,
} from "@/lib/orders/queries";
import { successPagePaymentMessage } from "@/lib/orders/rules";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout success",
  description: "Order received. Payment confirmation is verified server-side via Stripe webhooks.",
};

type Props = {
  searchParams: Promise<{ orderId?: string; session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const session = await requireUser({ next: "/checkout/success" });
  const params = await searchParams;

  const order =
    (params.orderId ? await getOrderById(params.orderId) : null) ??
    (params.session_id ? await getOrderByCheckoutSessionId(params.session_id) : null);

  const owned = order && order.userId === session.userId ? order : null;
  const message = owned
    ? successPagePaymentMessage(owned.paymentStatus)
    : "We could not find that order for your account.";

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="Thank you"
        title="Order received"
        description="Payment confirmation may take a moment. This page loads the live order status from our servers."
      />

      <Alert className="mt-8">
        <AlertTitle>Server-confirmed status only</AlertTitle>
        <AlertDescription>
          Loading this success page does not mark an order paid. We mark payment successful only
          after a verified Stripe webhook.
        </AlertDescription>
      </Alert>

      {owned ? (
        <div className="mt-8 space-y-4 text-sm">
          <p>
            Order <span className="font-medium">{owned.orderNumber}</span>
          </p>
          <p>Payment status: {owned.paymentStatus}</p>
          <p>Fulfillment status: {owned.fulfillmentStatus}</p>
          <p>
            Total: {formatMoney(owned.totalCents, owned.currencyCode)}
            {owned.paymentStatus === "pending" || owned.paymentStatus === "unpaid"
              ? " (tax may update after Stripe confirms payment)"
              : null}
          </p>
          <p className="text-muted-foreground">{message}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={toRoute(`/account/orders/${owned.id}`)}
              className={cn(buttonVariants())}
            >
              View order
            </Link>
            <Link
              href={toRoute(`/account/orders/${owned.id}/receipt`)}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Printable receipt
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link href={toRoute("/account/orders")} className={cn(buttonVariants())}>
            Order history
          </Link>
        </div>
      )}
    </PageShell>
  );
}
