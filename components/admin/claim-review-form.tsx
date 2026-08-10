"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  reviewBusinessClaimAction,
  type PortalActionState,
} from "@/lib/businesses/portal-actions";

const initial: PortalActionState = { ok: false };

export function ClaimReviewForm({ claimId }: { claimId: string }) {
  const [state, action, pending] = useActionState(reviewBusinessClaimAction, initial);

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
      <input type="hidden" name="claimId" value={claimId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <div className="space-y-2">
        <Label htmlFor={`status-${claimId}`}>Decision</Label>
        <select
          id={`status-${claimId}`}
          name="status"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3"
          defaultValue="under_review"
        >
          <option value="under_review">Keep under review</option>
          <option value="evidence_required">Request evidence</option>
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`notes-${claimId}`}>Reviewer notes</Label>
        <Textarea id={`notes-${claimId}`} name="reviewerNotes" rows={3} />
      </div>
      <Button type="submit" disabled={pending} className="h-11 px-5">
        {pending ? "Saving…" : "Update claim"}
      </Button>
    </form>
  );
}
