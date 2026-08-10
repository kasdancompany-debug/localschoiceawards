"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  supplierFulfillmentAction,
  supplierShipmentAction,
  type FulfillmentActionState,
} from "@/lib/fulfillment/actions";

const initial: FulfillmentActionState = { ok: false };

export function SupplierStatusActions({
  fulfillmentId,
  supplierId,
}: {
  fulfillmentId: string;
  supplierId: string;
}) {
  const [state, action, pending] = useActionState(supplierFulfillmentAction, initial);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["accept", "Accept"],
            ["reject", "Reject"],
            ["start_production", "Start production"],
            ["ready_to_ship", "Ready to ship"],
            ["complete", "Complete"],
          ] as const
        ).map(([value, label]) => (
          <form action={action} key={value}>
            <input type="hidden" name="fulfillmentId" value={fulfillmentId} />
            <input type="hidden" name="supplierId" value={supplierId} />
            <input type="hidden" name="action" value={value} />
            {value === "reject" ? (
              <input type="hidden" name="reason" value="Rejected by supplier" />
            ) : null}
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {label}
            </Button>
          </form>
        ))}
      </div>
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-foreground" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function SupplierShipmentForm({
  fulfillmentId,
  supplierId,
}: {
  fulfillmentId: string;
  supplierId: string;
}) {
  const [state, action, pending] = useActionState(supplierShipmentAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="fulfillmentId" value={fulfillmentId} />
      <input type="hidden" name="supplierId" value={supplierId} />
      <div className="space-y-1">
        <Label htmlFor="carrier">Carrier</Label>
        <Input id="carrier" name="carrier" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="service">Service</Label>
        <Input id="service" name="service" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="trackingNumber">Tracking number</Label>
        <Input id="trackingNumber" name="trackingNumber" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="trackingUrl">Tracking URL</Label>
        <Input id="trackingUrl" name="trackingUrl" type="url" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Record shipment & email customer"}
      </Button>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
    </form>
  );
}
