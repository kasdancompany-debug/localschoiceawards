import { notFound } from "next/navigation";

import { SupplierSectionNav } from "@/components/supplier/supplier-section-nav";
import {
  SupplierShipmentForm,
  SupplierStatusActions,
} from "@/components/supplier/fulfillment-forms";
import { getSignedArtworkUrl } from "@/lib/fulfillment/artwork";
import { canAccessSupplierFulfillment } from "@/lib/fulfillment/rules";
import { getFulfillmentDetail, getSupplierIdsForUser } from "@/lib/fulfillment/service";
import { resolveSupplierContext } from "@/lib/fulfillment/supplier-context";

type Props = { params: Promise<{ fulfillmentId: string }> };

export default async function SupplierOrderDetailPage({ params }: Props) {
  const { fulfillmentId } = await params;
  const { session, isPlatformOperator } = await resolveSupplierContext();
  const detail = await getFulfillmentDetail(fulfillmentId);
  if (!detail) {
    notFound();
  }

  const supplierIds = await getSupplierIdsForUser(session.userId);
  if (
    !canAccessSupplierFulfillment({
      actorSupplierIds: supplierIds,
      fulfillmentSupplierId: detail.fulfillment.supplierId,
      isPlatformAdmin: isPlatformOperator,
    })
  ) {
    notFound();
  }

  const customer = detail.fulfillment.customerSnapshot as Record<string, unknown>;
  const itemsWithArt = await Promise.all(
    detail.items.map(async (item) => ({
      item,
      artworkUrl: item.artworkStoragePath
        ? await getSignedArtworkUrl(item.artworkStoragePath)
        : null,
    })),
  );

  return (
    <div className="space-y-8">
      <SupplierSectionNav />
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {detail.fulfillment.supplierOrderReference ?? detail.fulfillment.id.slice(0, 8)}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Order {detail.orderNumber} · {detail.fulfillment.status}
        </p>
      </div>

      <section className="space-y-2 text-sm">
        <h2 className="font-heading text-xl font-semibold">Ship to</h2>
        <p>{String(customer.recipientName ?? "—")}</p>
        <p>{String(customer.line1 ?? "")}</p>
        {customer.line2 ? <p>{String(customer.line2)}</p> : null}
        <p>
          {String(customer.city ?? "")}, {String(customer.region ?? "")}{" "}
          {String(customer.postalCode ?? "")}
        </p>
        <p>{String(customer.country ?? "")}</p>
        <p className="text-muted-foreground">Contact email for delivery notices only.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Production items</h2>
        {itemsWithArt.map(({ item, artworkUrl }) => {
          const record = item.personalizationRecord as Record<string, unknown>;
          return (
            <article key={item.id} className="border-b border-border/70 pb-4 text-sm">
              <p className="font-medium">
                {String(record.productName ?? "Item")} · qty {String(record.quantity ?? 1)}
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
                {JSON.stringify(record, null, 2)}
              </pre>
              {artworkUrl ? (
                <a
                  href={artworkUrl}
                  className="mt-2 inline-block underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download protected artwork
                </a>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Update status</h2>
        <SupplierStatusActions
          fulfillmentId={detail.fulfillment.id}
          supplierId={detail.fulfillment.supplierId}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Shipment / tracking</h2>
        <SupplierShipmentForm
          fulfillmentId={detail.fulfillment.id}
          supplierId={detail.fulfillment.supplierId}
        />
        {detail.shipments.map((shipment) => (
          <p key={shipment.id} className="text-sm">
            {shipment.carrier} · {shipment.trackingNumber} · {shipment.status}
          </p>
        ))}
      </section>
    </div>
  );
}
