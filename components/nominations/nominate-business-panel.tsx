"use client";

import { useActionState, useCallback, useMemo, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createNominationAction,
  suggestMissingBusinessNominationAction,
  type NominationActionState,
} from "@/lib/nominations/actions";

const initialState: NominationActionState = { ok: false };

type BusinessOption = {
  locationId: string;
  name: string;
  city: string | null;
};

type Props = {
  campaignCategoryId: string;
  categoryName: string;
  businesses: BusinessOption[];
  isAuthenticated: boolean;
  emailConfirmed: boolean;
  loginHref: string;
};

export function NominateBusinessPanel({
  campaignCategoryId,
  categoryName,
  businesses,
  isAuthenticated,
  emailConfirmed,
  loginHref,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [suggestToken, setSuggestToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);
  const onSuggestTokenChange = useCallback((token: string) => setSuggestToken(token), []);

  const [nominateState, nominateAction, nominatePending] = useActionState(
    createNominationAction,
    initialState,
  );
  const [suggestState, suggestAction, suggestPending] = useActionState(
    suggestMissingBusinessNominationAction,
    initialState,
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return businesses.slice(0, 40);
    }
    return businesses
      .filter((business) => `${business.name} ${business.city ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 40);
  }, [businesses, query]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Sign in with a verified account to nominate in {categoryName}.
        </p>
        <a
          href={loginHref}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Sign in to nominate
        </a>
      </div>
    );
  }

  if (!emailConfirmed) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Verify your email address before nominating. Check your inbox for the confirmation link.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <form action={nominateAction} className="space-y-5 rounded-3xl border border-border/80 bg-card p-6">
        <input type="hidden" name="campaignCategoryId" value={campaignCategoryId} />
        <input type="hidden" name="businessLocationId" value={selectedLocationId} />
        <input type="hidden" name="turnstileToken" value={turnstileToken} />
        <AuthFormMessage tone="error" message={nominateState.message} />
        <div className="space-y-2">
          <Label htmlFor="business-search">Search eligible businesses</Label>
          <Input
            id="business-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Business name or city"
            className="h-11"
          />
        </div>
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {filtered.map((business) => {
            const selected = selectedLocationId === business.locationId;
            return (
              <li key={business.locationId}>
                <button
                  type="button"
                  onClick={() => setSelectedLocationId(business.locationId)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-foreground bg-muted/50"
                      : "border-border/70 hover:border-foreground/30"
                  }`}
                >
                  <span className="font-medium">{business.name}</span>
                  {business.city ? (
                    <span className="mt-1 block text-sm text-muted-foreground">{business.city}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {!filtered.length ? (
            <li className="text-sm text-muted-foreground">No matching businesses in this category.</li>
          ) : null}
        </ul>
        <TurnstileField onTokenChange={onTokenChange} />
        <Button type="submit" disabled={nominatePending || !selectedLocationId || !turnstileToken}>
          {nominatePending ? "Submitting…" : "Nominate"}
        </Button>
      </form>

      <form action={suggestAction} className="space-y-5 rounded-3xl border border-dashed border-border p-6">
        <div>
          <h3 className="font-heading text-xl font-semibold">Missing a business?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Suggest it here. Moderators must approve the listing before this nomination counts.
          </p>
        </div>
        <input type="hidden" name="campaignCategoryId" value={campaignCategoryId} />
        <input type="hidden" name="turnstileToken" value={suggestToken} />
        <AuthFormMessage tone="error" message={suggestState.message} />
        <div className="space-y-2">
          <Label htmlFor="suggest-name">Business name</Label>
          <Input id="suggest-name" name="businessName" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="suggest-address">Address</Label>
          <Textarea id="suggest-address" name="address" rows={2} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="suggest-website">Website</Label>
            <Input id="suggest-website" name="websiteUrl" type="url" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suggest-phone">Phone</Label>
            <Input id="suggest-phone" name="phone" className="h-11" />
          </div>
        </div>
        <TurnstileField onTokenChange={onSuggestTokenChange} />
        <Button type="submit" variant="outline" disabled={suggestPending || !suggestToken}>
          {suggestPending ? "Submitting…" : "Suggest & nominate"}
        </Button>
      </form>
    </div>
  );
}
