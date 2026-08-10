"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  invalidateNominationAction,
  reviewFraudSignalAction,
  type NominationActionState,
} from "@/lib/nominations/actions";

const initial: NominationActionState = { ok: false };

export function InvalidateNominationForm({ nominationId }: { nominationId: string }) {
  const [state, action, pending] = useActionState(invalidateNominationAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="nominationId" value={nominationId} />
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        message={state.message}
      />
      <div className="space-y-2">
        <Label htmlFor={`reason-${nominationId}`}>Invalidation reason</Label>
        <Input id={`reason-${nominationId}`} name="reason" required minLength={3} />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Invalidating…" : "Invalidate"}
      </Button>
    </form>
  );
}

export function ReviewFraudSignalForm({ signalId }: { signalId: string }) {
  const [state, action, pending] = useActionState(reviewFraudSignalAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="signalId" value={signalId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <select
        name="status"
        className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
        defaultValue="reviewed"
      >
        <option value="reviewed">Reviewed</option>
        <option value="dismissed">Dismissed</option>
        <option value="confirmed">Confirmed</option>
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Update"}
      </Button>
    </form>
  );
}
