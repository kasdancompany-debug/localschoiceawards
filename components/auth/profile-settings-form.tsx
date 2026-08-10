"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, type AuthActionState } from "@/lib/auth/actions";
import type { Profile } from "@/types/user";

const initialState: AuthActionState = { ok: false };

type ProfileSettingsFormProps = {
  profile: Profile;
};

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <div className="space-y-6">
      <AuthFormMessage
        tone={state.ok ? "success" : "error"}
        title={state.ok ? "Saved" : "Update problem"}
        message={state.message}
      />

      <form action={action} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-first-name">First name</Label>
            <Input
              id="settings-first-name"
              name="firstName"
              defaultValue={profile.firstName ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-last-name">Last name</Label>
            <Input
              id="settings-last-name"
              name="lastName"
              defaultValue={profile.lastName ?? ""}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-display-name">Display name</Label>
          <Input
            id="settings-display-name"
            name="displayName"
            defaultValue={profile.displayName ?? ""}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preferredLocale">Preferred locale</Label>
            <select
              id="preferredLocale"
              name="preferredLocale"
              defaultValue={profile.preferredLocale}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="en-CA">English (Canada)</option>
              <option value="en-US">English (United States)</option>
              <option value="fr-CA">Français (Canada)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredCurrency">Preferred currency</Label>
            <select
              id="preferredCurrency"
              name="preferredCurrency"
              defaultValue={profile.preferredCurrency}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
