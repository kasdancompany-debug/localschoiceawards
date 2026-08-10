"use client";

import Link from "next/link";
import { useActionState, useCallback, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerWithPasswordAction, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = { ok: false };

export function RegisterForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [state, action, pending] = useActionState(registerWithPasswordAction, initialState);

  return (
    <div className="space-y-6">
      <AuthFormMessage tone="error" title="Registration problem" message={state.message} />

      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="turnstileToken" value={turnstileToken} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
              aria-invalid={Boolean(state.fieldErrors?.firstName)}
            />
            {state.fieldErrors?.firstName ? (
              <p className="text-xs text-destructive" role="alert">
                {state.fieldErrors.firstName[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
              aria-invalid={Boolean(state.fieldErrors?.lastName)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
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

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby="password-help"
            aria-invalid={Boolean(state.fieldErrors?.password)}
          />
          <p id="password-help" className="text-xs text-muted-foreground">
            At least 8 characters, including a letter and a number.
          </p>
          {state.fieldErrors?.password ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
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

        <TurnstileField onTokenChange={onTokenChange} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
