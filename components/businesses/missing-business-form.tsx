"use client";

import { useActionState, useCallback, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitMissingBusinessAction,
  type BusinessFormState,
} from "@/lib/businesses/actions";

const initialState: BusinessFormState = { ok: false };

type MissingBusinessFormProps = {
  campaignId: string;
  categories: Array<{ id: string; name: string }>;
};

export function MissingBusinessForm({ campaignId, categories }: MissingBusinessFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const [state, action, pending] = useActionState(submitMissingBusinessAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="turnstileToken" value={turnstileToken} />
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        title={state.ok ? "Submitted for review" : undefined}
        message={state.message}
      />
      <div className="space-y-2">
        <Label htmlFor="missing-business-name">Business name</Label>
        <Input id="missing-business-name" name="businessName" required className="h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="missing-category">Category (optional)</Label>
        <select
          id="missing-category"
          name="categoryId"
          className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base"
          defaultValue=""
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="missing-address">Address</Label>
        <Textarea id="missing-address" name="address" rows={3} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="missing-website">Website</Label>
          <Input id="missing-website" name="websiteUrl" type="url" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="missing-phone">Phone</Label>
          <Input id="missing-phone" name="phone" className="h-11" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="missing-email">Your email</Label>
        <Input
          id="missing-email"
          name="submitterEmail"
          type="email"
          required
          autoComplete="email"
          className="h-11"
        />
      </div>
      <TurnstileField onTokenChange={onTokenChange} />
      <Button type="submit" disabled={pending} className="h-12 px-6 text-base">
        {pending ? "Submitting…" : "Submit missing business"}
      </Button>
    </form>
  );
}
