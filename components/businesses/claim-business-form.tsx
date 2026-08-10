"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitBusinessClaimAction,
  type PortalActionState,
} from "@/lib/businesses/portal-actions";

const initial: PortalActionState = { ok: false };

export function ClaimBusinessForm({
  businessId,
  defaultEmail,
}: {
  businessId?: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState(submitBusinessClaimAction, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <div className="space-y-2">
        <Label htmlFor="businessId">Business ID</Label>
        <Input
          id="businessId"
          name="businessId"
          required
          defaultValue={businessId ?? ""}
          placeholder="UUID of the business to claim"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="submittedEmail">Verification email</Label>
        <Input
          id="submittedEmail"
          name="submittedEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          A matching business-domain email helps review, but never auto-approves a claim.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="verificationMethod">Verification method</Label>
        <select
          id="verificationMethod"
          name="verificationMethod"
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3"
          defaultValue="domain_email"
        >
          <option value="domain_email">Business-domain email</option>
          <option value="manual_evidence">Manual evidence upload</option>
          <option value="admin_assisted">Admin assisted</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="evidenceStoragePath">Evidence storage path (optional)</Label>
        <Input id="evidenceStoragePath" name="evidenceStoragePath" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} />
      </div>
      <Button type="submit" disabled={pending} className="h-12 px-6">
        {pending ? "Submitting…" : "Submit claim"}
      </Button>
    </form>
  );
}
