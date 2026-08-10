"use client";

import Link from "next/link";
import { useActionState, useCallback, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { ok: false };

export function ForgotPasswordForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <div className="space-y-6">
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        title={state.ok ? "Check your inbox" : "Reset problem"}
        message={state.message}
      />

      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          {state.fieldErrors?.email ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <TurnstileField onTokenChange={onTokenChange} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
