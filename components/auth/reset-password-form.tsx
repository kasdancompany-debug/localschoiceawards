"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { ok: false };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <div className="space-y-6">
      <AuthFormMessage tone="error" title="Password update problem" message={state.message} />

      <form action={action} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby="new-password-help"
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <p id="new-password-help" className="text-xs text-muted-foreground">
            At least 8 characters, including a letter and a number.
          </p>
          {state.fieldErrors?.password ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Confirm new password</Label>
          <Input
            id="confirm-new-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          />
          {state.fieldErrors?.confirmPassword ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.confirmPassword[0]}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
