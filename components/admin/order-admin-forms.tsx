"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminFraudFlagsAction,
  adminRefundAction,
  type OrderActionState,
} from "@/lib/orders/actions";
import { ORDER_FRAUD_FLAG_OPTIONS } from "@/lib/orders/rules";

const initial: OrderActionState = { ok: false };

export function AdminRefundForm({
  orderId,
  maxAmountCents,
}: {
  orderId: string;
  maxAmountCents: number;
}) {
  const [state, action, pending] = useActionState(adminRefundAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="space-y-1">
        <Label htmlFor="amountCents">Refund amount (cents)</Label>
        <Input
          id="amountCents"
          name="amountCents"
          type="number"
          min={1}
          max={maxAmountCents}
          defaultValue={maxAmountCents}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" name="reason" required minLength={3} />
      </div>
      <p className="text-xs text-muted-foreground">
        Refunds never restore revoked award eligibility.
      </p>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Submitting…" : "Issue refund"}
      </Button>
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-foreground" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function AdminFraudForm({
  orderId,
  initialFlags,
  initialNotes,
}: {
  orderId: string;
  initialFlags: string[];
  initialNotes: string;
}) {
  const [state, action, pending] = useActionState(adminFraudFlagsAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Fraud flags</legend>
        {ORDER_FRAUD_FLAG_OPTIONS.map((flag) => (
          <label key={flag} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="flags"
              value={flag}
              defaultChecked={initialFlags.includes(flag)}
            />
            {flag}
          </label>
        ))}
      </fieldset>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initialNotes} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save fraud flags"}
      </Button>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
    </form>
  );
}
