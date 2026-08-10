"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateFinalistsAction,
  invalidateVoteAction,
  lockVotingAction,
  manualAddFinalistAction,
  publishFinalistsAction,
  reviewFinalistAction,
  type VotingActionState,
} from "@/lib/voting/actions";

const initial: VotingActionState = { ok: false };

export function GenerateFinalistsForm({
  campaignId,
  campaignCategoryId,
}: {
  campaignId: string;
  campaignCategoryId?: string;
}) {
  const [state, action, pending] = useActionState(generateFinalistsAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      {campaignCategoryId ? (
        <input type="hidden" name="campaignCategoryId" value={campaignCategoryId} />
      ) : null}
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate proposed finalists"}
      </Button>
    </form>
  );
}

export function PublishFinalistsForm({ campaignId }: { campaignId: string }) {
  const [state, action, pending] = useActionState(publishFinalistsAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish approved finalists"}
      </Button>
    </form>
  );
}

export function ReviewFinalistForm({ finalistId }: { finalistId: string }) {
  const [state, action, pending] = useActionState(reviewFinalistAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="finalistId" value={finalistId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <div className="space-y-2">
        <Label htmlFor={`action-${finalistId}`}>Action</Label>
        <select
          id={`action-${finalistId}`}
          name="action"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          defaultValue="approve"
        >
          <option value="approve">Approve (freeze snapshot)</option>
          <option value="remove">Remove</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`reason-${finalistId}`}>Removal reason</Label>
        <Input id={`reason-${finalistId}`} name="reason" placeholder="Required when removing" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Apply"}
      </Button>
    </form>
  );
}

export function ManualAddFinalistForm({
  campaignId,
  categories,
}: {
  campaignId: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, action, pending] = useActionState(manualAddFinalistAction, initial);
  return (
    <form action={action} className="space-y-3 rounded-3xl border border-dashed border-border p-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <div className="space-y-2">
        <Label htmlFor="manual-category">Category</Label>
        <select
          id="manual-category"
          name="campaignCategoryId"
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-location">Business location ID</Label>
        <Input id="manual-location" name="businessLocationId" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-notes">Reason / notes</Label>
        <Input id="manual-notes" name="notes" required minLength={3} />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Adding…" : "Add finalist manually"}
      </Button>
    </form>
  );
}

export function InvalidateVoteForm({ voteId }: { voteId: string }) {
  const [state, action, pending] = useActionState(invalidateVoteAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="voteId" value={voteId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <div className="space-y-2">
        <Label htmlFor={`vote-reason-${voteId}`}>Invalidation reason</Label>
        <Input id={`vote-reason-${voteId}`} name="reason" required minLength={3} />
      </div>
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "Invalidating…" : "Invalidate vote"}
      </Button>
    </form>
  );
}

export function LockVotingForm({
  campaignId,
  locked,
}: {
  campaignId: string;
  locked: boolean;
}) {
  const [state, action, pending] = useActionState(lockVotingAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="lock" value={locked ? "false" : "true"} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <Button type="submit" variant={locked ? "outline" : "destructive"} disabled={pending}>
        {pending ? "Updating…" : locked ? "Unlock voting" : "Lock voting"}
      </Button>
    </form>
  );
}
