"use client";

import Link from "next/link";
import { useActionState, useCallback, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginWithPasswordAction,
  requestMagicLinkAction,
  startGoogleOAuthAction,
  type AuthActionState,
} from "@/lib/auth/actions";

const initialState: AuthActionState = { ok: false };

type LoginFormProps = {
  next?: string;
  errorMessage?: string;
};

export function LoginForm({ next = "/account", errorMessage }: LoginFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    loginWithPasswordAction,
    initialState,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    requestMagicLinkAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <AuthFormMessage
        tone="error"
        title="Sign-in problem"
        message={errorMessage || (!passwordState.ok ? passwordState.message : undefined)}
      />
      <AuthFormMessage
        tone={magicState.ok ? "success" : "error"}
        title={magicState.ok ? "Magic link sent" : undefined}
        message={magicState.message}
      />

      <form action={passwordAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="turnstileToken" value={turnstileToken} />

        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(passwordState.fieldErrors?.email)}
            aria-describedby={passwordState.fieldErrors?.email ? "login-email-error" : undefined}
          />
          {passwordState.fieldErrors?.email ? (
            <p id="login-email-error" className="text-xs text-destructive" role="alert">
              {passwordState.fieldErrors.email[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="login-password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(passwordState.fieldErrors?.password)}
          />
        </div>

        <TurnstileField onTokenChange={onTokenChange} />

        <Button type="submit" className="w-full" disabled={passwordPending}>
          {passwordPending ? "Signing in…" : "Sign in with email"}
        </Button>
      </form>

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="bg-background px-2">or</span>
      </div>

      <form action={magicAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        <div className="space-y-2">
          <Label htmlFor="magic-email">Email for magic link</Label>
          <Input id="magic-email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" variant="outline" className="w-full" disabled={magicPending}>
          {magicPending ? "Sending…" : "Email me a magic link"}
        </Button>
      </form>

      <form action={startGoogleOAuthAction}>
        <input type="hidden" name="next" value={next} />
        <Button type="submit" variant="secondary" className="w-full">
          Continue with Google
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
