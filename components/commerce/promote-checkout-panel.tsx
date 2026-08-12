"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/commerce/rules";
import {
  startPromoteCheckoutAction,
  type PromoteActionState,
} from "@/lib/promotions/actions";
import type { CommerceCurrency } from "@/types/commerce";

const initial: PromoteActionState = { ok: false };

type PromoteCheckoutPanelProps = {
  businessId: string;
  communityId: string;
  businessName: string;
  currencyCode: CommerceCurrency;
  priceCents: number;
  defaultEmail?: string;
  alreadyActive?: boolean;
  returnPathPrefix?: string;
};

export function PromoteCheckoutPanel({
  businessId,
  communityId,
  businessName,
  currencyCode,
  priceCents,
  defaultEmail = "",
  alreadyActive = false,
  returnPathPrefix = "",
}: PromoteCheckoutPanelProps) {
  const [state, action, pending] = useActionState(startPromoteCheckoutAction, initial);

  if (alreadyActive) {
    return (
      <p className="text-sm text-muted-foreground">
        This business already has an active promotion subscription.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="communityId" value={communityId} />
      <input type="hidden" name="businessName" value={businessName} />
      <input type="hidden" name="currencyCode" value={currencyCode} />
      <input type="hidden" name="returnPathPrefix" value={returnPathPrefix} />

      <div className="space-y-2">
        <Label htmlFor="promote-email">Email for billing receipt</Label>
        <Input
          id="promote-email"
          name="customerEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="you@business.com"
          autoComplete="email"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {formatMoney(priceCents, currencyCode)} / month · cancel anytime. No password required.
      </p>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Starting…" : `Promote for ${formatMoney(priceCents, currencyCode)}/mo`}
      </Button>

      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
    </form>
  );
}
