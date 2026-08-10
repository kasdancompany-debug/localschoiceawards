"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminRemakeAction, type FulfillmentActionState } from "@/lib/fulfillment/actions";

const initial: FulfillmentActionState = { ok: false };

export function AdminRemakeForm({ fulfillmentId }: { fulfillmentId: string }) {
  const [state, action, pending] = useActionState(adminRemakeAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="fulfillmentId" value={fulfillmentId} />
      <div className="space-y-1">
        <Label htmlFor="reason">Remake reason</Label>
        <Textarea id="reason" name="reason" required minLength={3} />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Queuing…" : "Request remake"}
      </Button>
      {state.message ? <p className="text-sm">{state.message}</p> : null}
    </form>
  );
}
