"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteTeamMemberAction,
  type PortalActionState,
} from "@/lib/businesses/portal-actions";
import type { BusinessMembershipRole } from "@/types/business-access";

const initial: PortalActionState = { ok: false };

const roles: BusinessMembershipRole[] = [
  "administrator",
  "manager",
  "marketing",
  "viewer",
  "owner",
];

export function InviteTeamForm({
  businessId,
  actorRole,
}: {
  businessId: string;
  actorRole: BusinessMembershipRole;
}) {
  const [state, action, pending] = useActionState(inviteTeamMemberAction, initial);
  const allowed =
    actorRole === "owner"
      ? roles
      : roles.filter((role) => role !== "owner" && role !== actorRole);

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-border/80 bg-card p-6">
      <input type="hidden" name="businessId" value={businessId} />
      <AuthFormMessage tone={state.ok ? "success" : "error"} message={state.message} />
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" name="email" type="email" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <select
          id="invite-role"
          name="role"
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3"
          defaultValue="viewer"
        >
          {allowed.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Privilege escalation is blocked server-side. You cannot invite a role at or above your own
        unless you are an owner.
      </p>
      <Button type="submit" disabled={pending} className="h-12 px-6">
        {pending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}
