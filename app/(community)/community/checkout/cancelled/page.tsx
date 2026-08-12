import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getOrderById } from "@/lib/orders/queries";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  description: "Checkout was cancelled. Your cart is still available.",
};

type Props = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutCancelledPage({ searchParams }: Props) {
  const params = await searchParams;
  const order = params.orderId ? await getOrderById(params.orderId) : null;

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="Checkout"
        title="Payment cancelled"
        description="No charge was completed. You can return to your cart and try again when ready — no password required."
      />
      {order ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Pending order {order.orderNumber} remains unpaid and will not start fulfillment.
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={toRoute("/cart")} className={cn(buttonVariants())}>
          Return to cart
        </Link>
        <Link href={toRoute("/checkout")} className={cn(buttonVariants({ variant: "outline" }))}>
          Try checkout again
        </Link>
      </div>
    </PageShell>
  );
}
