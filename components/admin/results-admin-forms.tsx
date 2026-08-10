"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  approveResultRunAction,
  publishResultRunAction,
  revokeEligibilityAction,
  startResultRunAction,
  type ResultsActionState,
} from "@/lib/results/actions";

const initial: ResultsActionState = { ok: false };

export function StartResultRunForm({ campaignId }: { campaignId: string }) {
  const [state, action, pending] = useActionState(startResultRunAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Computing…" : "Start audited result run"}
      </Button>
    </form>
  );
}

export function ApproveResultRunForm({ resultRunId }: { resultRunId: string }) {
  const [state, action, pending] = useActionState(approveResultRunAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="resultRunId" value={resultRunId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Approving…" : "Approve run"}
      </Button>
    </form>
  );
}

export function PublishResultRunForm({ resultRunId }: { resultRunId: string }) {
  const [state, action, pending] = useActionState(publishResultRunAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="resultRunId" value={resultRunId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish winners"}
      </Button>
    </form>
  );
}

export function RevokeEligibilityForm({ eligibilityId }: { eligibilityId: string }) {
  const [state, action, pending] = useActionState(revokeEligibilityAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eligibilityId" value={eligibilityId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <div className="space-y-2">
        <Label htmlFor={`revoke-${eligibilityId}`}>Revocation reason</Label>
        <Input id={`revoke-${eligibilityId}`} name="reason" required minLength={3} />
      </div>
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Revoking…" : "Revoke eligibility"}
      </Button>
    </form>
  );
}
