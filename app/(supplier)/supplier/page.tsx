import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { SupplierSectionNav } from "@/components/supplier/supplier-section-nav";
import { buttonVariants } from "@/components/ui/button";
import {
  ACCEPTED_STATUSES,
  IN_PRODUCTION_STATUSES,
  NEW_ORDER_STATUSES,
  READY_TO_SHIP_STATUSES,
  REMAKE_STATUSES,
  SHIPPED_STATUSES,
} from "@/lib/fulfillment/rules";
import { listFulfillmentsForSupplier } from "@/lib/fulfillment/service";
import { resolveSupplierContext } from "@/lib/fulfillment/supplier-context";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { FulfillmentStatus } from "@/types/fulfillment";

export default async function SupplierDashboardPage() {
  const { suppliers, primarySupplierId } = await resolveSupplierContext();
  const fulfillments = primarySupplierId
    ? await listFulfillmentsForSupplier({ supplierId: primarySupplierId })
    : [];

  const count = (statuses: FulfillmentStatus[]) =>
    fulfillments.filter((item) => statuses.includes(item.status)).length;

  const cards = [
    { label: "New", href: "/supplier/orders/new", value: count(NEW_ORDER_STATUSES) },
    { label: "Accepted", href: "/supplier/orders/accepted", value: count(ACCEPTED_STATUSES) },
    {
      label: "In production",
      href: "/supplier/orders/in-production",
      value: count(IN_PRODUCTION_STATUSES),
    },
    {
      label: "Ready to ship",
      href: "/supplier/orders/ready-to-ship",
      value: count(READY_TO_SHIP_STATUSES),
    },
    { label: "Shipped", href: "/supplier/orders/shipped", value: count(SHIPPED_STATUSES) },
    { label: "Remakes", href: "/supplier/remakes", value: count(REMAKE_STATUSES) },
  ];

  return (
    <div className="space-y-6">
      <SupplierSectionNav current="/supplier" />
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Supplier dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          {suppliers[0]
            ? `${suppliers[0].name} · ${suppliers[0].countryCode} · ${suppliers[0].fulfillmentMethod}`
            : "No supplier membership assigned yet."}
        </p>
      </div>

      {!primarySupplierId ? (
        <EmptyState
          title="No supplier assignment"
          description="Ask an administrator to add your user to a supplier team."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={toRoute(card.href)}
              className={cn(
                "rounded-2xl border border-border/80 bg-card p-5 hover:bg-muted/40",
              )}
            >
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 font-heading text-3xl font-semibold">{card.value}</p>
            </Link>
          ))}
        </div>
      )}

      <Link href={toRoute("/supplier/products")} className={cn(buttonVariants({ variant: "outline" }))}>
        Product mappings
      </Link>
    </div>
  );
}
