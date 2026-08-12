"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createNominationAction,
  suggestMissingBusinessNominationAction,
  type NominationActionState,
} from "@/lib/nominations/actions";
import type { PublicBusinessListing } from "@/types/business";

const initialState: NominationActionState = { ok: false };

type ExistingProps = {
  mode: "existing";
  campaignCategoryId: string;
  categoryName: string;
  categorySlug: string;
  listing: PublicBusinessListing;
  isAuthenticated: boolean;
  emailConfirmed: boolean;
  loginHref: string;
  nominationsOpen: boolean;
  onNominated?: (listing?: PublicBusinessListing) => void;
};

type NewProps = {
  mode: "new";
  campaignCategoryId: string;
  categoryName: string;
  categorySlug: string;
  isAuthenticated: boolean;
  emailConfirmed: boolean;
  loginHref: string;
  nominationsOpen: boolean;
  onNominated?: (listing?: PublicBusinessListing) => void;
  triggerLabel?: string;
};

type Props = ExistingProps | NewProps;

export function NominateDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const onTokenChange = useCallback((token: string) => setTurnstileToken(token), []);

  const action =
    props.mode === "existing" ? createNominationAction : suggestMissingBusinessNominationAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.ok) {
      return undefined;
    }
    props.onNominated?.(state.listing);
    const timer = window.setTimeout(() => setOpen(false), 1200);
    return () => window.clearTimeout(timer);
    // Intentionally react only to successful submission results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, state.listing, state.nominationId]);

  if (!props.nominationsOpen) {
    return null;
  }

  const returnPath =
    props.mode === "existing"
      ? `/category/${props.categorySlug}`
      : `/category/${props.categorySlug}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTurnstileToken("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            size={props.mode === "existing" ? "sm" : "lg"}
            variant={props.mode === "existing" ? "outline" : "default"}
            className={props.mode === "existing" ? "h-9" : "h-12 px-6"}
          />
        }
      >
        {props.mode === "existing"
          ? "Nominate"
          : (props.triggerLabel ?? "Nominate a business")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {props.mode === "existing"
              ? `Nominate ${props.listing.business.publicName}`
              : `Nominate in ${props.categoryName}`}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "existing"
              ? "Confirm the nomination. We’ll email the business that they’ve been nominated."
              : "Add a business to this category list and we’ll email them that they’ve been nominated."}
          </DialogDescription>
        </DialogHeader>

        {!props.isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in with a verified email to nominate.
            </p>
            <Button render={<a href={props.loginHref} />}>Sign in to nominate</Button>
          </div>
        ) : !props.emailConfirmed ? (
          <p className="text-sm text-muted-foreground">
            Verify your email address before nominating. Check your inbox for the confirmation
            link.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="campaignCategoryId" value={props.campaignCategoryId} />
            <input type="hidden" name="turnstileToken" value={turnstileToken} />
            <input type="hidden" name="inline" value="1" />
            <input type="hidden" name="returnPath" value={returnPath} />
            {props.mode === "existing" ? (
              <input type="hidden" name="businessLocationId" value={props.listing.location.id} />
            ) : null}

            <AuthFormMessage
              tone={state.ok ? "success" : "error"}
              message={state.message}
            />

            {props.mode === "new" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nominate-business-name">Business name</Label>
                  <Input
                    id="nominate-business-name"
                    name="businessName"
                    required
                    className="h-11"
                    placeholder="Business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nominate-address">Address</Label>
                  <Textarea id="nominate-address" name="address" rows={2} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nominate-website">Website</Label>
                    <Input id="nominate-website" name="websiteUrl" type="url" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominate-phone">Phone</Label>
                    <Input id="nominate-phone" name="phone" className="h-11" />
                  </div>
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="nominate-business-email">Business email</Label>
              <Input
                id="nominate-business-email"
                name="businessEmail"
                type="email"
                required={props.mode === "new"}
                defaultValue={
                  props.mode === "existing"
                    ? props.listing.location.email ||
                      props.listing.business.primaryEmail ||
                      ""
                    : ""
                }
                className="h-11"
                placeholder="business@example.com"
              />
              <p className="text-xs text-muted-foreground">
                We’ll send “You’ve been nominated” to this address.
              </p>
            </div>

            <TurnstileField onTokenChange={onTokenChange} />

            <DialogFooter>
              <Button type="submit" disabled={pending || !turnstileToken} className="w-full sm:w-auto">
                {pending ? "Submitting…" : "Submit nomination"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
