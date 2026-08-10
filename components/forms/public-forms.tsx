"use client";

import { useActionState, useCallback, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitCommunityRequestAction,
  submitContactFormAction,
  submitLaunchListAction,
  type PublicFormState,
} from "@/lib/public/actions";

const initialState: PublicFormState = { ok: false };

export function ContactForm({ sourcePath = "/contact" }: { sourcePath?: string }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [state, action, pending] = useActionState(submitContactFormAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="turnstileToken" value={turnstileToken} />
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        title={state.ok ? "Message sent" : undefined}
        message={state.message}
      />
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" name="name" required autoComplete="name" className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea id="contact-message" name="message" required rows={5} />
      </div>
      <TurnstileField onTokenChange={onTokenChange} />
      <Button type="submit" disabled={pending} className="h-12 px-6 text-base">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

export function CommunityRequestForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [state, action, pending] = useActionState(submitCommunityRequestAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="turnstileToken" value={turnstileToken} />
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        title={state.ok ? "Request received" : undefined}
        message={state.message}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="request-name">Your name</Label>
          <Input id="request-name" name="name" required autoComplete="name" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="request-email">Email</Label>
          <Input
            id="request-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="request-community">Community name</Label>
        <Input id="request-community" name="communityName" required className="h-11" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="request-region">Province, territory, or state</Label>
          <Input id="request-region" name="region" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="request-country">Country</Label>
          <select
            id="request-country"
            name="country"
            required
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base"
            defaultValue="CA"
          >
            <option value="CA">Canada</option>
            <option value="US">United States</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="request-notes">Anything else we should know?</Label>
        <Textarea id="request-notes" name="notes" rows={4} />
      </div>
      <TurnstileField onTokenChange={onTokenChange} />
      <Button type="submit" disabled={pending} className="h-12 px-6 text-base">
        {pending ? "Submitting…" : "Request your community"}
      </Button>
    </form>
  );
}

export function LaunchListForm({ communityId }: { communityId: string }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [state, action, pending] = useActionState(submitLaunchListAction, initialState);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="turnstileToken" value={turnstileToken} />
      <input type="hidden" name="communityId" value={communityId} />
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        title={state.ok ? "You’re on the list" : undefined}
        message={state.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="launch-name">Name</Label>
          <Input id="launch-name" name="name" autoComplete="name" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="launch-email">Email</Label>
          <Input
            id="launch-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>
      </div>
      <TurnstileField onTokenChange={onTokenChange} />
      <Button type="submit" disabled={pending} className="h-12 px-6 text-base">
        {pending ? "Joining…" : "Join launch list"}
      </Button>
    </form>
  );
}
