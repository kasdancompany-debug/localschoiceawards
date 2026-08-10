"use client";

import { useActionState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateBusinessProfileAction,
  updateBusinessSocialAction,
  type PortalActionState,
} from "@/lib/businesses/portal-actions";

const initial: PortalActionState = { ok: false };

export function BusinessProfileForm({
  businessId,
  publicName,
  description,
  websiteUrl,
  primaryPhone,
  socialLinks,
}: {
  businessId: string;
  publicName: string;
  description: string;
  websiteUrl: string | null;
  primaryPhone: string | null;
  socialLinks: Array<{ platform: string; url: string }>;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateBusinessProfileAction,
    initial,
  );
  const [socialState, socialAction, socialPending] = useActionState(
    updateBusinessSocialAction,
    initial,
  );

  return (
    <div className="space-y-10">
      <form action={profileAction} className="space-y-4 rounded-3xl border border-border/80 bg-card p-6">
        <input type="hidden" name="businessId" value={businessId} />
        <AuthFormMessage
          tone={profileState.ok ? "success" : "error"}
          message={profileState.message}
        />
        <div className="space-y-2">
          <Label htmlFor="publicName">Public name</Label>
          <Input id="publicName" name="publicName" defaultValue={publicName} required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={description} rows={5} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={websiteUrl ?? ""}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryPhone">Phone</Label>
            <Input
              id="primaryPhone"
              name="primaryPhone"
              defaultValue={primaryPhone ?? ""}
              className="h-11"
            />
          </div>
        </div>
        <Button type="submit" disabled={profilePending} className="h-12 px-6">
          {profilePending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <form action={socialAction} className="space-y-4 rounded-3xl border border-border/80 bg-card p-6">
        <input type="hidden" name="businessId" value={businessId} />
        <AuthFormMessage tone={socialState.ok ? "success" : "error"} message={socialState.message} />
        <p className="text-sm text-muted-foreground">
          Provide a JSON array of {"{ platform, url }"}. Platforms: facebook, instagram, x, tiktok,
          youtube, linkedin, other.
        </p>
        <div className="space-y-2">
          <Label htmlFor="linksEditor">Social links JSON</Label>
          <Textarea
            id="linksEditor"
            name="linksJson"
            defaultValue={JSON.stringify(socialLinks, null, 2)}
            rows={6}
          />
        </div>
        <Button type="submit" disabled={socialPending} className="h-12 px-6">
          {socialPending ? "Saving…" : "Save social links"}
        </Button>
      </form>
    </div>
  );
}
