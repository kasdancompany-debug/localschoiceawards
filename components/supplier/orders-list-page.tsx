import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { SupplierSectionNav } from "@/components/supplier/supplier-section-nav";
import { buttonVariants } from "@/components/ui/button";
import { listFulfillmentsForSupplier } from "@/lib/fulfillment/service";
import { resolveSupplierContext } from "@/lib/fulfillment/supplier-context";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { FulfillmentStatus } from "@/types/fulfillment";

export async function SupplierOrdersListPage(input: {
  title: string;
  current: string;
  statuses: FulfillmentStatus[];
}) {
  const { primarySupplierId } = await resolveSupplierContext();
  const fulfillments = primarySupplierId
    ? await listFulfillmentsForSupplier({
        supplierId: primarySupplierId,
        statuses: input.statuses,
      })
    : [];

  return (
    <div className="space-y-6">
      <SupplierSectionNav current={input.current} />
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{input.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Customer PII is limited to shipping essentials required for production.
        </p>
      </div>
      {fulfillments.length ? (
        <ul className="space-y-3">
          {fulfillments.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3"
            >
              <div className="text-sm">
                <p className="font-medium">{item.supplierOrderReference ?? item.id.slice(0, 8)}</p>
                <p className="text-muted-foreground">
                  {item.status} · {item.destinationCountryCode ?? "—"}
                </p>
              </div>
              <Link
                href={toRoute(`/supplier/orders/${item.id}`)}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No orders" description="Nothing in this queue right now." />
      )}
    </div>
  );
}
