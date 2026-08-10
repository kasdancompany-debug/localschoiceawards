"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import {
  acceptInvitationAction,
  type PortalActionState,
} from "@/lib/businesses/portal-actions";

const initial: PortalActionState = { ok: false };

export function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(acceptInvitationAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      {!token ? (
        <p className="text-sm text-muted-foreground">Missing invitation token.</p>
      ) : (
        <Button type="submit" disabled={pending} className="h-12 px-6">
          {pending ? "Accepting…" : "Accept invitation"}
        </Button>
      )}
    </form>
  );
}
