import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/session";
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
  const session = await getAuthenticatedSession();
  const params = await searchParams;

  const order =
    (params.orderId ? await getOrderById(params.orderId) : null) ??
    (params.session_id ? await getOrderByCheckoutSessionId(params.session_id) : null);

  // Guests may complete checkout without an account. Order UUID in the success URL is the access token.
  const canView =
    order &&
    (!order.userId ||
      !session ||
      order.userId === session.userId ||
      (session.email &&
        order.customerEmail.toLowerCase() === session.email.toLowerCase()));

  const visible = canView ? order : null;
  const message = visible
    ? successPagePaymentMessage(visible.paymentStatus)
    : "We could not find that order.";

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="Thank you"
        title="Order received"
        description="Payment confirmation may take a moment. This page loads the live order status from our servers — no login required for guest checkouts."
      />

      <Alert className="mt-8">
        <AlertTitle>Server-confirmed status only</AlertTitle>
        <AlertDescription>
          Loading this success page does not mark an order paid. We mark payment successful only
          after a verified Stripe webhook.
        </AlertDescription>
      </Alert>

      {visible ? (
        <div className="mt-8 space-y-4 text-sm">
          <p>
            Order <span className="font-medium">{visible.orderNumber}</span>
          </p>
          <p>Receipt email: {visible.customerEmail}</p>
          <p>Payment status: {visible.paymentStatus}</p>
          <p>Fulfillment status: {visible.fulfillmentStatus}</p>
          <p>
            Total: {formatMoney(visible.totalCents, visible.currencyCode)}
            {visible.paymentStatus === "pending" || visible.paymentStatus === "unpaid"
              ? " (tax may update after Stripe confirms payment)"
              : null}
          </p>
          <p className="text-muted-foreground">{message}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {session && visible.userId === session.userId ? (
              <>
                <Link
                  href={toRoute(`/account/orders/${visible.id}`)}
                  className={cn(buttonVariants())}
                >
                  View order
                </Link>
                <Link
                  href={toRoute(`/account/orders/${visible.id}/receipt`)}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Printable receipt
                </Link>
              </>
            ) : (
              <Link href={toRoute("/order")} className={cn(buttonVariants())}>
                Order another business
              </Link>
            )}
            <Link href={toRoute("/cart")} className={cn(buttonVariants({ variant: "outline" }))}>
              Back to cart
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link href={toRoute("/order")} className={cn(buttonVariants())}>
            Search businesses
          </Link>
        </div>
      )}
    </PageShell>
  );
}
